import { useEffect, useRef, useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ActionSheetIOS, Image,
  Dimensions
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Audio } from 'expo-av'
import useChatStore from '@/store/chatStore'
import { getSocket } from '@/lib/socket'
import api from '@/lib/api'
import { format } from 'date-fns'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const EMOJIS = ['👍','❤️','😂','😮','😢','🔥','✅','👀']

function MessageBubble({ msg, channelId, currentUserId }) {
  const { updateMessage, deleteMessage } = useChatStore()
  const isOwn = msg.sender_id === currentUserId
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const longPress = async () => {
    if (!isOwn) return
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Edit', 'Delete'], cancelButtonIndex: 0, destructiveButtonIndex: 2 },
        async (idx) => {
          if (idx === 1) promptEdit()
          if (idx === 2) confirmDelete()
        }
      )
    } else {
      Alert.alert('Message', 'Choose action', [
        { text: 'Edit', onPress: promptEdit },
        { text: 'Delete', onPress: confirmDelete, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const promptEdit = () => {
    Alert.prompt('Edit Message', '', async (newText) => {
      if (!newText?.trim()) return
      const socket = await getSocket()
      socket.emit('message:edit', { message_id: msg.id, channel_id: channelId, content: newText })
      updateMessage(channelId, msg.id, { content: newText, is_edited: 1 })
    }, 'plain-text', msg.content)
  }

  const confirmDelete = () => {
    Alert.alert('Delete', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const socket = await getSocket()
          socket.emit('message:delete', { message_id: msg.id, channel_id: channelId })
          deleteMessage(channelId, msg.id)
        }
      }
    ])
  }

  const toggleReaction = async (emoji) => {
    const socket = await getSocket()
    socket.emit('reaction:toggle', { message_id: msg.id, channel_id: channelId, emoji })
  }

  const playPauseAudio = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync()
        setIsPlaying(false)
      } else {
        await sound.playAsync()
        setIsPlaying(true)
      }
      return
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: msg.file_url },
      { shouldPlay: true }
    )
    setSound(newSound)
    setIsPlaying(true)
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setIsPlaying(false)
        newSound.unloadAsync()
        setSound(null)
      }
    })
  }

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync()
    }
  }, [sound])

  if (msg.is_deleted) return (
    <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
      <View style={[styles.bubble, styles.bubbleDeleted]}>
        <Text style={styles.deletedText}>🚫 Message deleted</Text>
      </View>
    </View>
  )

  const groupedReactions = (msg.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || []
    acc[r.emoji].push(r.user_id)
    return acc
  }, {})

  return (
    <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
      {!isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{msg.sender_name?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        onLongPress={longPress}
        activeOpacity={0.9}
      >
        {!isOwn && <Text style={styles.senderName}>{msg.sender_name}</Text>}

        {msg.type === 'image' ? (
          <Image source={{ uri: msg.file_url }} style={styles.bubbleImage} resizeMode="cover" />
        ) : msg.type === 'voice' || msg.type === 'audio' ? (
          <TouchableOpacity onPress={playPauseAudio} style={styles.audioRow}>
            <Text style={styles.audioIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
            <View style={styles.waveformContainer}>
               <View style={styles.waveform} />
            </View>
            <Text style={styles.audioDuration}>{msg.duration || '0:00'}</Text>
          </TouchableOpacity>
        ) : msg.type === 'file' ? (
          <View style={styles.fileMsg}>
            <Text style={styles.fileIcon}>📎</Text>
            <Text style={styles.fileName} numberOfLines={1}>{msg.content}</Text>
          </View>
        ) : (
          <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>{msg.content}</Text>
        )}

        <View style={styles.msgMeta}>
          <Text style={styles.msgTime}>{msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}</Text>
          {isOwn && (
            <Text style={styles.tick}>
              {msg.status?.every(s => s.read_at) ? '✓✓' : msg.status?.every(s => s.delivered_at) ? '✓✓' : '✓'}
            </Text>
          )}
        </View>

        {Object.keys(groupedReactions).length > 0 && (
          <View style={styles.reactionsRow}>
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionChip, users.includes(currentUserId) && styles.reactionChipActive]}
                onPress={() => toggleReaction(emoji)}
              >
                <Text style={styles.reactionText}>{emoji} {users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams()
  const router = useRouter()
  const { channels, messages, user, setMessages, typingUsers, addMessage } = useChatStore()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const flatListRef = useRef(null)
  const typingRef = useRef(null)

  const channel = channels.find(c => c.id === channelId)
  const channelMessages = messages[channelId] || []
  const typingInChannel = typingUsers[channelId]
    ? [...typingUsers[channelId]].filter(id => id !== user?.id)
    : []

  useEffect(() => {
    api.get(`/messages/${channelId}`)
      .then(r => { setMessages(channelId, r.data.data); setLoading(false) })
      .catch(() => setLoading(false))

    // Socket listeners for receipts
    const initSocket = async () => {
      const socket = await getSocket()
      socket.emit('message:read', { channel_id: channelId, message_ids: channelMessages.filter(m => m.sender_id !== user?.id).map(m => m.id) })
    }
    initSocket()
  }, [channelId])

  const handleTyping = async (val) => {
    setText(val)
    const socket = await getSocket()
    socket.emit('typing:start', { channel_id: channelId })
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => socket.emit('typing:stop', { channel_id: channelId }), 2000)
  }

  const sendMessage = async () => {
    if (!text.trim()) return
    const socket = await getSocket()
    socket.emit('message:send', { channel_id: channelId, content: text.trim(), type: 'text' })
    setText('')
  }

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      setRecording(newRecording)
      setIsRecording(true)
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording')
    }
  }

  const stopRecording = async () => {
    if (!recording) return
    setIsRecording(false)
    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    setRecording(null)
    uploadFile(uri, 'audio/m4a', 'voice_note.m4a', true)
  }

  const pickFile = async () => {
    Alert.alert('Attach', 'Choose file type', [
      {
        text: 'Image/Video', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All })
          if (!result.canceled) {
            const asset = result.assets[0]
            uploadFile(asset.uri, asset.type === 'video' ? 'video/mp4' : 'image/jpeg', asset.fileName || 'upload.jpg')
          }
        }
      },
      {
        text: 'Document', onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync()
          if (!result.canceled && result.assets?.[0]) {
            const f = result.assets[0]
            uploadFile(f.uri, f.mimeType, f.name)
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  const uploadFile = async (uri, mimeType, name, isVoice = false) => {
    try {
      const formData = new FormData()
      formData.append('file', { uri, type: mimeType, name })
      if (isVoice) formData.append('is_voice', 'true')

      const { data } = await api.post(`/files/upload/${channelId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const socket = await getSocket()
      socket.emit('message:send', {
        channel_id: channelId,
        content: data.data.file_name,
        type: data.data.type,
        file_url: data.data.file_url,
        duration: data.data.metadata?.duration
      })
    } catch {
      Alert.alert('Error', 'Upload failed')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{channel?.name || '...'}</Text>
          <Text style={styles.headerStatus}>{typingInChannel.length > 0 ? 'typing...' : 'online'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#1db791" size="large" /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={channelMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <MessageBubble msg={item} channelId={channelId} currentUserId={user?.id} />}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
          />
        )}

        <View style={styles.inputArea}>
          <TouchableOpacity onPress={pickFile} style={styles.iconBtn}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              multiline
            />
            <TouchableOpacity style={styles.emojiBtn}>
              <Text style={styles.emojiIcon}>😊</Text>
            </TouchableOpacity>
          </View>

          {text.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendIcon}>🚀</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, isRecording && styles.sendBtnRecording]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0d11' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#2a2d35', backgroundColor: '#12141a' },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 32, color: '#1db791' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerStatus: { fontSize: 12, color: '#1db791' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  msgRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end' },
  msgRowOwn: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1db791', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  bubble: { maxWidth: SCREEN_WIDTH * 0.75, borderRadius: 12, padding: 8, position: 'relative' },
  bubbleOwn: { backgroundColor: '#056162', borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: '#262d31', borderBottomLeftRadius: 2 },
  bubbleDeleted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3a3d45' },

  senderName: { fontSize: 12, fontWeight: '700', color: '#1db791', marginBottom: 2 },
  msgText: { fontSize: 15, color: '#fff', lineHeight: 20 },
  msgTextOwn: { color: '#fff' },
  deletedText: { color: '#6b7280', fontStyle: 'italic' },

  bubbleImage: { width: SCREEN_WIDTH * 0.65, height: 200, borderRadius: 8, marginBottom: 4 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 150, paddingVertical: 4 },
  audioIcon: { fontSize: 20 },
  waveformContainer: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  waveform: { width: '30%', height: '100%', backgroundColor: '#1db791' },
  audioDuration: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  fileMsg: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 8 },
  fileIcon: { fontSize: 20 },
  fileName: { color: '#fff', fontSize: 14, flex: 1 },

  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  tick: { fontSize: 10, color: '#34b7f1' },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  reactionChip: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  reactionChipActive: { backgroundColor: 'rgba(29, 183, 145, 0.2)', borderColor: '#1db791' },
  reactionText: { fontSize: 11, color: '#fff' },

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, gap: 8, backgroundColor: '#12141a' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  plusIcon: { fontSize: 24, color: '#9ca3af' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#1e2028', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  textInput: { flex: 1, color: '#fff', fontSize: 16, maxHeight: 120, paddingRight: 32 },
  emojiBtn: { position: 'absolute', right: 12, bottom: 10 },
  emojiIcon: { fontSize: 20 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1db791', justifyContent: 'center', alignItems: 'center' },
  sendBtnRecording: { backgroundColor: '#ef4444', transform: [{ scale: 1.1 }] },
  micIcon: { fontSize: 22 },
  sendIcon: { fontSize: 20 },
})
