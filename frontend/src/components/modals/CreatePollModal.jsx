import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart3, Plus, Trash2 } from 'lucide-react'
import { useRoomContext } from '../../context/RoomContext'
import { useSocketContext } from '../../context/SocketContext'
import { emitCreatePoll } from '../../services/socketService'
import { soundFx } from '../../utils/soundEffects'
import { toast } from 'react-hot-toast'
import Button from '../ui/Button'

/**
 * CreatePollModal — Pop-up modal for Host / Moderator to launch a live room poll.
 */
export default function CreatePollModal({ isOpen, onClose }) {
  const { room, currentUser } = useRoomContext()
  const { socket } = useSocketContext()

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index, value) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!question.trim()) {
      toast.error('Please enter a poll question.')
      return
    }
    const validOptions = options.map(o => o.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      toast.error('Poll must have at least 2 valid options.')
      return
    }

    if (socket && room?.roomId) {
      emitCreatePoll(socket, {
        roomId: room.roomId,
        question: question.trim(),
        options: validOptions,
        creatorUsername: currentUser?.username || 'Host',
      })
      soundFx.playGrantFanfare()
      toast.success('Live video poll created!', { icon: '📊' })
      setQuestion('')
      setOptions(['', ''])
      onClose()
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      <div key="poll-modal-root" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          key="poll-modal-backdrop"
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          key="poll-modal-card"
          className="bg-[#18181b] border border-[#d0bcff]/40 w-full max-w-md rounded-2xl p-6 shadow-[0_0_50px_rgba(87,27,193,0.25)] relative z-10 overflow-hidden flex flex-col gap-4 text-left my-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow accent */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#571bc1]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#571bc1]/20 border border-[#d0bcff]/40 flex items-center justify-center text-[#d0bcff]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-[Geist,sans-serif] font-bold text-[18px] text-[#e5e1e4]">
                Create Live Video Poll
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#e4beba] hover:text-[#e5e1e4] hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
            {/* Poll Question */}
            <div className="flex flex-col gap-1.5">
              <label className="font-[Geist,sans-serif] font-medium text-[13px] text-[#e4beba]">
                Poll Question / Quiz Title
              </label>
              <input
                type="text"
                placeholder="e.g. What will happen next in this video?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-[#0e0e10] border border-[#27272A] rounded-xl px-4 py-2.5 font-[Inter,sans-serif] text-[14px] text-[#e5e1e4] placeholder:text-[#e4beba]/40 focus:outline-none focus:border-[#d0bcff] focus:ring-1 focus:ring-[#d0bcff]/30 transition-all duration-200"
                autoFocus
              />
            </div>

            {/* Poll Options */}
            <div className="flex flex-col gap-2">
              <label className="font-[Geist,sans-serif] font-medium text-[13px] text-[#e4beba] flex justify-between items-center">
                <span>Poll Options (2 - 4)</span>
                {options.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[12px] text-[#d0bcff] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </label>

              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-center font-[Geist,sans-serif] font-bold text-[12px] text-[#d0bcff]">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-[#0e0e10] border border-[#27272A] rounded-xl px-3.5 py-2 font-[Inter,sans-serif] text-[13px] text-[#e5e1e4] placeholder:text-[#e4beba]/40 focus:outline-none focus:border-[#d0bcff] transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              variant="secondary"
              fullWidth
              className="mt-2"
            >
              <BarChart3 className="w-4 h-4" /> Launch Poll Live
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
