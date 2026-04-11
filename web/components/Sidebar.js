'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useChatStore from '@/store/chatStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function Sidebar({ activeChannelId }) {
  const router = useRouter()
  const { user, channels, addChannel } = useChatStore()
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [creating, setCreating] = useState(false)
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch all users for DM search
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users')
        setUsers(data.filter(u => u.id !== user?.id))
      } catch (err) {
        console.error('Failed to fetch users', err)
      }
    }
    fetchUsers()
  }, [user])

  const startDM = async (userId) => {
    try {
      const { data } = await api.post(`/channels/dm/${userId}`)
      addChannel(data)
      router.push(`/chat/${data.id}`)
    } catch (err) {
      toast.error('Could not start direct message')
    }
  }

  const publicChannels = channels.filter(c => c.type === 'public')
  const privateChannels = channels.filter(c => c.type === 'private')
  const dmChannels = channels.filter(c => c.type === 'direct')


  const createChannel = async e => {
    e.preventDefault()
    if (!newChannelName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/channels', { name: newChannelName.toLowerCase().replace(/\s+/g, '-') })
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
    <div className="w-64 bg-[#12141a] border-r border-[#2a2d35] flex flex-col h-screen flex-shrink-0">
      {/* Workspace header */}
      <div className="p-4 border-b border-[#2a2d35]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">10x</div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">10x Digital Ventures</p>
            <p className="text-xs text-green-400">● Online</p>
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Public Channels */}
        <div className="px-3 mb-1">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</span>
            <button onClick={() => setShowNewChannel(!showNewChannel)} className="text-gray-400 hover:text-white text-lg leading-none">+</button>
          </div>
          {showNewChannel && (
            <form onSubmit={createChannel} className="mt-2 mb-2">
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="text-sm py-1.5 px-2"
                autoFocus
              />
              <button type="submit" className="btn-primary text-sm py-1.5 mt-1" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </form>
          )}
          {publicChannels.map(ch => (
            <Link key={ch.id} href={`/chat/${ch.id}`}>
              <div className={`sidebar-item flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${activeChannelId === ch.id ? 'active text-white' : 'text-gray-400 hover:text-white'}`}>
                <span className="text-gray-500">#</span>
                <span className="truncate">{ch.name}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Private Groups */}
        {privateChannels.length > 0 && (
          <div className="px-3 mb-1 mt-3">
            <div className="py-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Private Groups</span>
            </div>
            {privateChannels.map(ch => (
              <Link key={ch.id} href={`/chat/${ch.id}`}>
                <div className={`sidebar-item flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${activeChannelId === ch.id ? 'active text-white' : 'text-gray-400 hover:text-white'}`}>
                  <span className="text-gray-500">🔒</span>
                  <span className="truncate">{ch.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Direct Messages */}
        <div className="px-3 mb-1 mt-3">
          <div className="py-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Direct Messages</span>
          </div>
          
          {/* User Search for new DM */}
          <div className="mt-2 mb-2">
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full text-sm py-1.5 px-2 bg-[#1a1d24] border border-[#2a2d35] rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md bg-[#1a1d24] border border-[#2a2d35]">
                {users
                  .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => startDM(u.id)}
                      className="flex items-center gap-2 px-2 py-2 cursor-pointer text-sm text-gray-400 hover:text-white hover:bg-[#2a2d35]"
                    >
                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px] text-white">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="truncate">{u.name}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Existing DM Channels */}
          {dmChannels.map(ch => (
            <Link key={ch.id} href={`/chat/${ch.id}`}>
              <div className={`sidebar-item flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm ${activeChannelId === ch.id ? 'active text-white' : 'text-gray-400 hover:text-white'}`}>
                <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white">
                  {ch.name?.[0]?.toUpperCase()}
                </div>
                <span className="truncate">{ch.name}</span>
              </div>
            </Link>
          ))}
        </div>

      </div>

       {/* User profile bottom */}
       <div className="p-3 border-t border-[#2a2d35] flex items-center gap-2">
         <Link href="/profile" className="flex items-center gap-2 w-full hover:bg-white/[0.03] p-1 rounded-md transition-colors">
           <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
             {user?.name?.[0]?.toUpperCase() || 'U'}
           </div>
           <div className="flex-1 min-w-0">
             <p className="text-sm text-white font-medium truncate">{user?.name}</p>
             <p className="text-xs text-gray-400 truncate">{user?.email}</p>
           </div>
           <button onClick={(e) => { e.preventDefault(); logout(); }} title="Logout" className="text-gray-400 hover:text-white text-sm px-1">↪</button>
         </Link>
       </div>

    </div>
  )
}
