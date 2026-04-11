'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import useChatStore from '@/store/chatStore'
import api from '@/lib/api'
import Message from '@/components/Message'
import MessageInput from '@/components/MessageInput'
import MembersList from '@/components/MembersList'

export default function ChannelPage() {
  const { channelId } = useParams()
  const { channels, messages, setMessages, setMembers, setActiveChannel, typingUsers, user } = useChatStore()
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const channel = channels.find(c => c.id === channelId)
  const channelMessages = messages[channelId] || []

  const typingInChannel = typingUsers[channelId]
    ? [...typingUsers[channelId]].filter(id => id !== user?.id)
    : []

  useEffect(() => {
    if (!channelId) return
    setActiveChannel(channel)
    setLoading(true)

    Promise.all([
      api.get(`/messages/${channelId}`),
      api.get(`/channels/${channelId}/members`),
    ]).then(([msgRes, memRes]) => {
      setMessages(channelId, msgRes.data)
      setMembers(memRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [channelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages.length])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Channel Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2d35] bg-[#0f1117] flex-shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-lg">#</span>
              <h2 className="font-semibold text-white">{channel?.name || 'loading...'}</h2>
            </div>
            {channel?.topic && (
              <p className="text-xs text-gray-400 mt-0.5">{channel.topic}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : channelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <p className="text-4xl mb-2">#</p>
              <p className="font-medium text-white">Welcome to #{channel?.name}!</p>
              <p className="text-sm mt-1">This is the beginning of the channel.</p>
            </div>
          ) : (
            channelMessages.map(msg => (
              <Message key={msg.id} msg={msg} channelId={channelId} />
            ))
          )}

          {/* Typing indicator */}
          {typingInChannel.length > 0 && (
            <div className="px-4 py-1 flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-400">Someone is typing...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput channelId={channelId} channelName={channel?.name} />
      </div>

      {/* Members sidebar */}
      <MembersList />
    </div>
  )
}
