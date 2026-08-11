import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Check, X, Users } from 'lucide-react'
import { useRoomContext } from '../../context/RoomContext'
import { useSocketContext } from '../../context/SocketContext'
import { emitVotePoll, emitEndPoll } from '../../services/socketService'
import { soundFx } from '../../utils/soundEffects'
import { toast } from 'react-hot-toast'

/**
 * LivePollOverlay — displays an interactive poll overlay on top of the video player.
 */
export default function LivePollOverlay() {
  const { activePoll, currentUser, canControl, room } = useRoomContext()
  const { socket } = useSocketContext()

  if (!activePoll || !activePoll.active) return null

  const roomId = room?.roomId
  const effectiveUsername = currentUser?.username || room?.participants?.find(p => p.socketId === socket?.id)?.username || ''

  // Total votes cast across all options
  const totalVotes = activePoll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0)

  // Has current user voted?
  const userVotedOptionId = activePoll.options.find(
    opt => opt.votes?.some(u => u.trim().toLowerCase() === effectiveUsername.trim().toLowerCase())
  )?.optionId

  const handleVote = (optionId) => {
    if (!socket || !roomId || !effectiveUsername) {
      toast.error('Unable to cast vote. Please rejoin room.')
      return
    }
    soundFx.playReactionPop()
    emitVotePoll(socket, { roomId, optionId, username: effectiveUsername })
    toast.success('Vote submitted!', { icon: '🗳️' })
  }

  const handleEndPoll = () => {
    if (!socket || !roomId) return
    soundFx.playLeaveSound()
    emitEndPoll(socket, { roomId })
    toast('Poll ended.', { icon: '🛑' })
  }

  return (
    <AnimatePresence>
      <motion.div
        key={activePoll.pollId}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-5xl bg-[#131315]/95 backdrop-blur-xl border border-[#d0bcff]/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(87,27,193,0.25)] text-left select-none overflow-hidden relative z-20 my-2"
      >
        {/* Glow accent */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#571bc1]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#571bc1]/30 border border-[#d0bcff]/40 text-[#d0bcff] text-[10px] font-bold font-[Geist,sans-serif] uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] animate-pulse" />
              LIVE POLL
            </span>
            <span className="text-[11px] text-[#e4beba]/60 font-[Inter,sans-serif]">
              by {activePoll.creatorUsername}
            </span>
          </div>

          {canControl && (
            <button
              onClick={handleEndPoll}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-lg border border-red-500/30 transition-colors"
              title="Close Poll"
            >
              End Poll
            </button>
          )}
        </div>

        {/* Question */}
        <h4 className="font-[Geist,sans-serif] font-bold text-[15px] leading-snug text-[#e5e1e4] mb-3 relative z-10">
          {activePoll.question}
        </h4>

        {/* Options List */}
        <div className="flex flex-col gap-2 relative z-10">
          {activePoll.options.map((opt) => {
            const voteCount = opt.votes?.length || 0
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
            const isSelected = userVotedOptionId === opt.optionId

            return (
              <button
                key={opt.optionId}
                onClick={() => handleVote(opt.optionId)}
                className={`relative w-full overflow-hidden text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#571bc1]/30 border-[#d0bcff] ring-1 ring-[#d0bcff]/50'
                    : 'bg-[#1c1b1d]/80 border-[#27272A] hover:border-[#d0bcff]/40 hover:bg-[#2a2a2c]/90'
                }`}
              >
                {/* Progress bar background */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-[#571bc1]/25 pointer-events-none rounded-xl"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {/* Option Text */}
                <span className="font-[Inter,sans-serif] text-[13px] font-medium text-[#e5e1e4] relative z-10 flex items-center gap-1.5 truncate pr-2">
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#d0bcff] flex-shrink-0" />}
                  {opt.text}
                </span>

                {/* Stats */}
                <div className="flex items-center gap-1.5 relative z-10 flex-shrink-0">
                  <span className="font-[Geist,sans-serif] font-bold text-[12px] text-[#d0bcff]">
                    {percentage}%
                  </span>
                  <span className="text-[10px] text-[#e4beba]/50 font-[Inter,sans-serif]">
                    ({voteCount})
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer info */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#e4beba]/60 font-[Inter,sans-serif] relative z-10 pt-1 border-t border-[#5b403e]/20">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[#d0bcff]" /> {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
          <span>Click option to vote</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
