import { useState } from 'react'
import { Copy, Check, Wifi, WifiOff, Crown, Volume2, VolumeX } from 'lucide-react'
import useCopyToClipboard from '../../hooks/useCopyToClipboard'
import { useSocketContext } from '../../context/SocketContext'
import { useRoomContext } from '../../context/RoomContext'
import { emitRequestControl } from '../../services/socketService'
import ThemePicker from '../ui/ThemePicker'
import { soundFx } from '../../utils/soundEffects'
import { toast } from 'react-hot-toast'

/**
 * RoomHeader — top bar inside the watch room.
 * Shows: WatchSync brand, room name, room code chip, copy button, connection status, theme picker, sound FX toggle.
 */
export default function RoomHeader() {
  const { room, canControl } = useRoomContext()
  const { socket, isConnected } = useSocketContext()
  const { copied, copy } = useCopyToClipboard()
  const [isMuted, setIsMuted] = useState(soundFx.isMuted)

  const roomId = room?.roomId || ''
  const inviteUrl = `${window.location.origin}/room/${roomId}`

  const handleRequestControl = () => {
    if (!socket || !roomId) return
    emitRequestControl(socket, { roomId })
    toast.success('Permission request sent to host!', { icon: '👑' })
  }

  const handleToggleSfx = () => {
    const muted = soundFx.toggleMute()
    setIsMuted(muted)
    toast(muted ? 'Sound Effects Muted 🔇' : 'Sound Effects Active 🔊', { duration: 1500 })
  }

  return (
    <header className="bg-[#131315]/60 backdrop-blur-md shadow-sm fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 border-b border-[#5b403e]/20">
      {/* Left: Brand + Room Info */}
      <div className="flex items-center gap-3">
        <img src="/favicon.svg" alt="WatchSync Logo" className="w-7 h-7 drop-shadow-[0_0_8px_rgba(255,84,81,0.5)]" />
        <h1 className="font-[Geist,sans-serif] text-[24px] font-bold text-[#ffb3ad] tracking-[-0.01em]">
          WatchSync
        </h1>

        <div className="h-6 w-px bg-[#5b403e]/30 hidden md:block" />

        {/* Room code chip */}
        {room && (
          <div className="hidden md:flex items-center gap-2 glass-floating px-3 py-1 rounded-full">
            {/* Connection dot */}
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse-green' : 'bg-yellow-500'}`} />
            <span className="font-[Geist,sans-serif] font-medium text-[14px] text-[#e5e1e4]">
              {room.roomName}
            </span>
            <span className="font-[Geist,sans-serif] text-[12px] text-[#e4beba] ml-1 bg-[#131315] px-2 py-0.5 rounded">
              #{roomId}
            </span>
            <button
              id="copy-invite-btn"
              onClick={() => copy(inviteUrl)}
              className="text-[#e4beba] hover:text-[#ffb3ad] transition-colors ml-1"
              title="Copy invite link"
            >
              {copied
                ? <Check className="w-4 h-4 text-green-400" />
                : <Copy className="w-4 h-4" />
              }
            </button>
          </div>
        )}
      </div>

      {/* Right: Connection indicator, Request Control, SFX Toggle & Theme Picker */}
      <div className="flex items-center gap-3">
        {/* Non-hosts get Request Control button */}
        {!canControl && (
          <button
            onClick={handleRequestControl}
            className="px-3 py-1.5 bg-[#ff5451]/15 hover:bg-[#ff5451] border border-[#ff5451]/30 text-[#ffb3ad] hover:text-white rounded-full font-[Geist,sans-serif] text-[12px] font-bold transition-all shadow-md flex items-center gap-1.5"
            title="Ask Host for Playback Control Permissions"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Request Control</span>
          </button>
        )}

        {/* Sound Effects Toggle Button */}
        <button
          onClick={handleToggleSfx}
          className={`p-2 rounded-full border transition-all duration-200 ${
            isMuted
              ? 'bg-[#131315]/80 border-red-500/30 text-red-400 hover:bg-red-500/10'
              : 'bg-[#131315]/80 border-[#ff5451]/30 text-[#ffb3ad] hover:bg-[#ff5451]/15 shadow-[0_0_10px_rgba(255,84,81,0.2)]'
          }`}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <ThemePicker />
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-[Geist,sans-serif] font-medium ${
          isConnected
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
        }`}>
          {isConnected
            ? <><Wifi className="w-3.5 h-3.5" /> Connected</>
            : <><WifiOff className="w-3.5 h-3.5" /> Reconnecting...</>
          }
        </div>
      </div>
    </header>
  )
}
