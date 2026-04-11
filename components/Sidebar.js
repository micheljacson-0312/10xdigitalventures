'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useChatStore from '@/store/chatStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function Sidebar({ activeChannelId }) {
  const router = useRouter()
  const { user, channels, addChannel } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'groups'
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [creating, setCreating] = useState(false)

  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'groups' && ch.type !== 'dm') || 
        (filter === 'unread' && ch.unread_count > 0)
      return matchesSearch && matchesFilter
    })
  }, [channels, searchQuery, filter])

  const createChannel = async e => {
    e.preventDefault()
    if (!newChannelName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/channels', { 
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        type: 'public' 
      })
      addChannel(data)
      setShowNewChannel(false)
      setNewChannelName('')
      router.push(`/chat/${data.id}`)
    } catch {
      toast.error('Could not create channel')
    } finally {
      setCreating(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.replace('/login')
  }

  return (
    <div className="w-80 bg-[#111b21] border-r border-[#222d34] flex flex-col h-screen flex-shrink-0 text-[#e9edef]">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-[#202c33]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">10x Chat</span>
            <span className="text-[10px] text-green-400">Online</span>
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-[#3b4a54] rounded-full transition-colors text-[#aebac1]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="p-3 space-y-3 bg-[#111b21]">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-[#202c33] text-sm py-2 pl-10 pr-4 rounded-lg outline-none focus:ring-1 ring-brand-500 transition-all text-[#e9edef] placeholder-[#8696a0]"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'unread', 'groups'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                filter === f 
                ? 'bg-brand-500 text-white' 
                : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {showNewChannel && (
          <div className="p-4 bg-[#111b21] border-b border-[#222d34]">
            <form onSubmit={createChannel} className="space-y-2">
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="Channel name..."
                className="w-full bg-[#202c33] text-sm py-2 px-3 rounded-md outline-none focus:ring-1 ring-brand-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-brand-500 text-white text-xs py-2 rounded-md font-medium" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowNewChannel(false)} className="flex-1 bg-[#202c33] text-xs py-2 rounded-md font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col">
          {filteredChannels.length > 0 ? (
            filteredChannels.map(ch => (
              <Link key={ch.id} href={`/chat/${ch.id}`}>
                <div className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                  activeChannelId === ch.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    ch.type === 'dm' ? 'bg-brand-500' : 'bg-gray-600'
                  }`}>
                    {ch.name?.[0]?.toUpperCase() || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{ch.name}</span>
                      <span className="text-[10px] text-[#8696a0]">12:45 PM</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#8696a0] truncate">Last message...</span>
                      {ch.unread_count > 0 && (
                        <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {ch.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#8696a0]">
              <p className="text-sm">No chats found</p>
              <button 
                onClick={() => setShowNewChannel(true)}
                className="mt-2 text-xs text-brand-500 hover:underline"
              >
                Create new channel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-[#202c33] text-center">
         <button 
            onClick={() => setShowNewChannel(true)}
            className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-full transition-colors"
         >
           + New Chat
         </button>
      </div>
    </div>
  )
}
