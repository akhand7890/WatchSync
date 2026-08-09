import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Check, X, ShieldAlert } from 'lucide-react'
import { useRoomContext } from '../../context/RoomContext'
import { useSocketContext } from '../../context/SocketContext'
import { emitGrantControl } from '../../services/socketService'
import { toast } from 'react-hot-toast'

/**
 * ControlRequestModal — Pop-up modal shown to Host when a participant requests playback control.
 */
export default function ControlRequestModal({ request, onClose }) {
  const { room } = useRoomContext()
  const { socket } = useSocketContext()

  if (!request || typeof document === 'undefined') return null

  const handleGrant = () => {
    if (!room?.roomId || !socket) return
    emitGrantControl(socket, {
      roomId: room.roomId,
      targetSocketId: request.requesterSocketId,
    })
    toast.success(`Granted playback control to ${request.requesterUsername}!`, { icon: '👑' })
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="bg-[#18181b] border border-[#ff5451]/40 w-full max-w-md rounded-2xl p-6 shadow-[0_0_50px_rgba(255,84,81,0.2)] relative z-10 overflow-hidden flex flex-col gap-4 text-center my-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-full bg-[#ff5451]/20 border border-[#ff5451]/40 flex items-center justify-center mx-auto text-[#ff5451]">
            <Crown className="w-7 h-7" />
          </div>

          <div>
            <h3 className="font-[Geist,sans-serif] font-bold text-[20px] text-[#e5e1e4] mb-1">
              Permission Requested
            </h3>
            <p className="font-[Inter,sans-serif] text-[14px] text-[#e4beba]/80 leading-relaxed">
              <strong className="text-[#ffb3ad]">{request.requesterUsername}</strong> wants permission to control video playback (play, pause, seek, and speed).
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-[Geist,sans-serif] font-semibold text-[13px] rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Deny
            </button>
            <button
              onClick={handleGrant}
              className="flex-1 py-2.5 bg-[#ff5451] hover:bg-[#ffb3ad] text-white hover:text-[#68000a] font-[Geist,sans-serif] font-bold text-[13px] rounded-xl transition-all shadow-lg shadow-[#ff5451]/25 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Grant Control
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
