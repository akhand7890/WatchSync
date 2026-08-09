import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Play, Pause, FastForward, UserPlus, LogOut, Heart, Plus, ThumbsUp, ShieldAlert, Sparkles } from 'lucide-react'
import { useRoomContext } from '../../context/RoomContext'

const TYPE_ICONS = {
  join: { icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  leave: { icon: LogOut, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  play: { icon: Play, color: 'text-green-400', bg: 'bg-green-500/10' },
  pause: { icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  speed: { icon: FastForward, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  reaction: { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  queue_add: { icon: Plus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  queue_upvote: { icon: ThumbsUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  role: { icon: ShieldAlert, color: 'text-[#ff5451]', bg: 'bg-[#ff5451]/10' },
  default: { icon: Activity, color: 'text-[#ffb3ad]', bg: 'bg-[#ffb3ad]/10' },
}

function formatTime(timestamp) {
  if (!timestamp) return 'Just now'
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityTimeline() {
  const { activityLog } = useRoomContext()

  if (!activityLog || activityLog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-[#e4beba]/30">
        <div className="w-16 h-16 rounded-full bg-[#ffb3ad]/5 border border-[#5b403e]/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-[#ffb3ad]/40" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-[Geist,sans-serif] font-semibold text-[15px] text-[#e5e1e4]">
            No Room Activity Yet
          </p>
          <p className="font-[Inter,sans-serif] text-[12px] max-w-[200px] mx-auto text-[#e4beba]/40 leading-relaxed">
            Room events, playback changes, and participant joins will appear here in real-time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
      <AnimatePresence initial={false}>
        {activityLog.map((act, index) => {
          const config = TYPE_ICONS[act.type] || TYPE_ICONS.default
          const Icon = config.icon

          return (
            <motion.div
              key={act.id || index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#1b1a20]/40 border border-[#5b403e]/10 hover:border-[#ffb3ad]/20 transition-all duration-200"
            >
              <div className={`p-2 rounded-lg ${config.bg} ${config.color} flex-shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-[Geist,sans-serif] font-bold text-[12px] text-[#e5e1e4] truncate">
                    {act.username || 'System'}
                  </span>
                  <span className="font-[Inter,sans-serif] text-[10px] text-[#e4beba]/40 flex-shrink-0">
                    {formatTime(act.timestamp)}
                  </span>
                </div>
                <p className="font-[Inter,sans-serif] text-[12px] text-[#e4beba]/80 leading-snug">
                  {act.text}
                </p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
