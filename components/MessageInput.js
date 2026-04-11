'use client'
import { useState, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function MessageInput({ channelId, channelName }) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const typingRef = useRef(null)

  const handleTyping = (val) => {
    setText(val)
    const socket = getSocket()
    socket.emit('typing:start', { channel_id: channelId })
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => {
      socket.emit('typing:stop', { channel_id: channelId })
    }, 2000)
  }

  const sendMessage = () => {
    if (!text.trim()) return
    const socket = getSocket()
    socket.emit('message:send', { channel_id: channelId, content: text.trim(), type: 'text' })
    socket.emit('typing:stop', { channel_id: channelId })
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { toast.error('File too large (max 50MB)'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post(`/files/upload/${channelId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const socket = getSocket()
      socket.emit('message:send', {
        channel_id: channelId,
        content: data.file_name,
        type: data.type,
        file_url: data.file_url,
      })
      toast.success('File uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end gap-2 bg-[#1e2028] border border-[#3a3d45] rounded-xl p-2 focus-within:border-[#185FA5] transition-colors">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          title="Attach file"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>
        <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />

        <textarea
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName || 'channel'}`}
          className="flex-1 bg-transparent border-none resize-none text-sm py-1.5 max-h-32 min-h-[36px]"
          rows={1}
          style={{ outline: 'none' }}
        />

        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="p-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1 px-1">Press Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
