'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import useChatStore from '@/store/chatStore'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'

const EMOJIS = ['👍','❤️','😂','😮','😢','🔥','✅','👀']

export default function Message({ msg, channelId }) {
  const { user, updateMessage, deleteMessage } = useChatStore()
  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(msg.content)
  const [showEmoji, setShowEmoji] = useState(false)

  const isOwn = msg.sender_id === user?.id
  const isDeleted = msg.is_deleted === 1

  const saveEdit = () => {
    if (!editContent.trim()) return
    const socket = getSocket()
    socket.emit('message:edit', { message_id: msg.id, channel_id: channelId, content: editContent })
    updateMessage(channelId, msg.id, { content: editContent, is_edited: 1 })
    setEditing(false)
  }

  const deleteMsg = () => {
    if (!confirm('Delete this message?')) return
    const socket = getSocket()
    socket.emit('message:delete', { message_id: msg.id, channel_id: channelId })
    deleteMessage(channelId, msg.id)
  }

  const toggleReaction = (emoji) => {
    const socket = getSocket()
    socket.emit('reaction:toggle', { message_id: msg.id, channel_id: channelId, emoji })
    setShowEmoji(false)
  }

  const groupedReactions = () => {
    if (!msg.reactions?.length) return {}
    return msg.reactions.reduce((acc, r) => {
      acc[r.emoji] = acc[r.emoji] || []
      acc[r.emoji].push(r.user_id)
      return acc
    }, {})
  }

  if (isDeleted) {
    return (
      <div className="flex gap-3 px-4 py-1.5 group">
        <div className="w-8 h-8 flex-shrink-0" />
        <div className="text-sm text-gray-500 italic">This message was deleted</div>
      </div>
    )
  }

  return (
    <div
      className="message-bubble flex gap-3 px-4 py-1.5 hover:bg-white/[0.03] group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmoji(false) }}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">
        {msg.sender_name?.[0]?.toUpperCase() || 'U'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white">{msg.sender_name}</span>
          <span className="text-xs text-gray-500">
            {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
          </span>
          {msg.is_edited === 1 && <span className="text-xs text-gray-500">(edited)</span>}
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="text-sm resize-none py-2"
              rows={2}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() } if (e.key === 'Escape') setEditing(false) }}
            />
            <div className="flex gap-2 mt-1">
              <button onClick={saveEdit} className="text-xs text-brand-100 hover:underline">Save</button>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {msg.type === 'image' ? (
              <img src={msg.file_url || msg.content} alt="Image" className="max-w-xs rounded-lg mt-1 border border-[#3a3d45]" />
            ) : msg.type === 'file' ? (
              <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#1e2028] rounded-lg border border-[#3a3d45] text-sm text-brand-100 hover:border-brand-500 w-fit">
                📎 {msg.content}
              </a>
            ) : (
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>
            )}
          </>
        )}

        {/* Reactions */}
        {Object.keys(groupedReactions()).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(groupedReactions()).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${users.includes(user?.id) ? 'bg-brand-500/20 border-brand-500' : 'bg-[#1e2028] border-[#3a3d45] hover:border-gray-400'}`}
              >
                {emoji} <span className="text-gray-300">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && !editing && (
        <div className="message-actions absolute right-4 top-0 -translate-y-1/2 flex items-center gap-1 bg-[#1a1d24] border border-[#3a3d45] rounded-lg px-1 py-0.5 shadow-lg">
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 hover:bg-white/10 rounded text-sm" title="React">😊</button>
            {showEmoji && (
              <div className="absolute bottom-8 right-0 bg-[#1a1d24] border border-[#3a3d45] rounded-lg p-2 flex gap-1 shadow-xl z-50">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => toggleReaction(e)} className="hover:scale-125 transition-transform text-base">{e}</button>
                ))}
              </div>
            )}
          </div>
          {isOwn && (
            <>
              <button onClick={() => { setEditing(true); setShowActions(false) }} className="p-1.5 hover:bg-white/10 rounded text-xs text-gray-400 hover:text-white" title="Edit">✏️</button>
              <button onClick={deleteMsg} className="p-1.5 hover:bg-white/10 rounded text-xs text-gray-400 hover:text-red-400" title="Delete">🗑️</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
