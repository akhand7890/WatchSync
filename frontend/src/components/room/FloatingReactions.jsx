import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocketContext } from '../../context/SocketContext'
import { useRoomContext } from '../../context/RoomContext'
import { EVENTS, emitSendReaction } from '../../services/socketService'

const EMOJIS = ['❤️', '🔥', '👏', '🍿', '🚀', '😂']

/**
 * ReactionButtons — renders reaction emoji buttons to trigger floating reactions.
 */
export function ReactionButtons() {
  const { socket } = useSocketContext()
  const { room } = useRoomContext()
  const roomId = room?.roomId

  const triggerReaction = (emoji) => {
    // Emit over socket if connected
    if (socket && roomId) {
      emitSendReaction(socket, { roomId, emoji })
    } else if (socket) {
      // Also dispatch a window event for local preview if outside room
      window.dispatchEvent(new CustomEvent('local_reaction', { detail: { emoji } }))
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 bg-[#131315]/90 border border-[#5b403e]/30 px-3 py-1.5 rounded-xl shadow-lg w-full mt-2">
      <span className="text-[11px] font-bold text-[#ffb3ad] mr-1 font-[Geist,sans-serif]">
        React:
      </span>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => triggerReaction(emoji)}
          className="text-lg p-1 hover:scale-130 active:scale-90 transition-transform duration-150 focus:outline-none"
          title={`Send ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

/**
 * FloatingReactionsCanvas — displays animated floating emojis over the video player.
 */
export function FloatingReactionsCanvas() {
  const { socket } = useSocketContext()
  const [reactions, setReactions] = useState([])

  const addReaction = (payload) => {
    setReactions((prev) => [...prev, payload])
    setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== payload.id))
    }, 3500)
  }

  useEffect(() => {
    // Handle socket reactions
    if (socket) {
      const handleReaction = (payload) => {
        addReaction(payload)
      }
      socket.on(EVENTS.REACTION_RECEIVED, handleReaction)
      return () => socket.off(EVENTS.REACTION_RECEIVED, handleReaction)
    }
  }, [socket])

  useEffect(() => {
    // Handle local preview reactions
    const handleLocal = (e) => {
      addReaction({
        id: `local-${Date.now()}-${Math.random()}`,
        emoji: e.detail.emoji,
        username: 'You',
        xPos: Math.floor(Math.random() * 70) + 15,
      })
    }
    window.addEventListener('local_reaction', handleLocal)
    return () => window.removeEventListener('local_reaction', handleLocal)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: '100%', x: `${r.xPos}%`, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: ['85%', '45%', '15%', '-15%'],
              scale: [0.6, 1.4, 1.2, 0.8],
              x: [
                `${r.xPos}%`,
                `${r.xPos + 4}%`,
                `${r.xPos - 4}%`,
                `${r.xPos}%`,
              ],
            }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            className="absolute bottom-4 flex flex-col items-center select-none"
          >
            <span className="text-4xl drop-shadow-[0_0_15px_rgba(255,84,81,0.8)]">
              {r.emoji}
            </span>
            <span className="text-[10px] font-bold text-white bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow-md">
              {r.username}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function FloatingReactions() {
  return (
    <>
      <FloatingReactionsCanvas />
      <ReactionButtons />
    </>
  )
}
