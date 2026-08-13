import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Plus, Play, Loader2 } from 'lucide-react'
import { useRoomContext } from '../../context/RoomContext'
import { useSocketContext } from '../../context/SocketContext'
import { emitQueueAdd, emitChangeVideo } from '../../services/socketService'
import { toast } from 'react-hot-toast'

/**
 * YouTubeSearchModal — In-app search modal for YouTube videos.
 * Uses React createPortal to render directly into document.body,
 * avoiding parent overflow/transform clipping issues.
 */
export default function YouTubeSearchModal({ isOpen, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const { room, canControl } = useRoomContext()
  const { socket } = useSocketContext()

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery)
      executeSearch(initialQuery)
    }
  }, [isOpen, initialQuery])

  const executeSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim()
    if (!q) return

    setIsSearching(true)
    try {
      let items = []

      // Primary Strategy: WatchSync Backend Proxy Endpoint
      try {
        const res = await fetch(`/api/rooms/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.items && data.items.length > 0) {
            items = data.items
          }
        }
      } catch (err) {
        console.warn('Backend search API failed, attempting direct mirrors...', err)
      }

      // Secondary Fallback: Direct Piped / Invidious Mirrors
      if (items.length === 0) {
        const mirrors = [
          `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=all`,
          `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
        ]
        for (const mirror of mirrors) {
          try {
            const mRes = await fetch(mirror)
            if (mRes.ok) {
              const mData = await mRes.json()
              const rawItems = Array.isArray(mData) ? mData : (mData.items || [])
              items = rawItems.slice(0, 15).map(item => {
                const videoId = item.videoId || (item.url ? item.url.replace('/watch?v=', '') : item.id)
                return {
                  videoId,
                  title: item.title,
                  uploaderName: item.author || item.uploaderName || 'YouTube',
                  thumbnail: item.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                  duration: item.duration || item.lengthSeconds || 0,
                }
              }).filter(i => i.videoId)

              if (items.length > 0) break
            }
          } catch {}
        }
      }

      if (items.length > 0) {
        setResults(items)
      } else {
        throw new Error('No items found')
      }
    } catch {
      toast.error('Search temporarily unavailable. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e) => {
    e?.preventDefault()
    executeSearch(query)
  }

  const handleAddToQueue = (item) => {
    if (!room?.roomId || !socket) return

    emitQueueAdd(socket, {
      roomId: room.roomId,
      videoId: item.videoId,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration || 0,
    })

    toast.success(`Queued: ${item.title}`)
  }

  const handlePlayNow = (item) => {
    if (!room?.roomId || !socket || !canControl) return

    emitChangeVideo(socket, {
      roomId: room.roomId,
      videoId: item.videoId,
      title: item.title,
    })

    toast.success(`Now Playing: ${item.title}`)
    onClose()
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          className="bg-[#18181b] border border-[#5b403e]/50 w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10 my-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#ff5451]" />
              <h2 className="font-[Geist,sans-serif] font-bold text-[20px] text-[#e5e1e4]">
                Search YouTube Videos
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#e4beba] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by keywords (e.g. lofi beats, trailer, tutorial)..."
                className="w-full bg-[#09090b] border border-[#3f3f46] rounded-xl px-4 py-2.5 font-[Inter,sans-serif] text-[14px] text-[#e5e1e4] placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5451] transition-colors"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-[#ff5451] hover:bg-[#ffb3ad] hover:text-[#68000a] text-white font-[Geist,sans-serif] font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff5451]" />
                <p className="text-[13px]">Searching YouTube...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p className="text-[14px]">Type keywords above to search YouTube without leaving WatchSync!</p>
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.videoId}
                  className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-[#27272a]/50 hover:bg-[#27272a] border border-zinc-800 transition-colors"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full sm:w-32 aspect-video object-cover rounded-lg bg-black"
                  />
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h4 className="font-[Inter,sans-serif] font-medium text-[14px] text-[#e5e1e4] line-clamp-2 leading-snug mb-1">
                      {item.title}
                    </h4>
                    <p className="font-[Inter,sans-serif] text-[12px] text-zinc-400">
                      {item.uploaderName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAddToQueue(item)}
                      className="px-3 py-1.5 bg-[#ff5451]/20 border border-[#ff5451]/30 hover:bg-[#ff5451] text-[#ffb3ad] hover:text-white rounded-lg font-[Geist,sans-serif] text-[12px] font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Queue
                    </button>
                    {canControl && (
                      <button
                        onClick={() => handlePlayNow(item)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-[Geist,sans-serif] text-[12px] font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
