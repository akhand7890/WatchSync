import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import RoomHeader from '../components/room/RoomHeader'
import VideoPlayer from '../components/room/VideoPlayer'
import LivePollOverlay from '../components/room/LivePollOverlay'
import QueueInput from '../components/room/QueueInput'
import Sidebar from '../components/room/Sidebar'
import ConnectionBanner from '../components/room/ConnectionBanner'
import ControlRequestModal from '../components/modals/ControlRequestModal'
import { useRoomContext } from '../context/RoomContext'
import { useSocketContext } from '../context/SocketContext'
import { EVENTS } from '../services/socketService'
import { getRoom } from '../services/api'
import { soundFx } from '../utils/soundEffects'

/**
 * RoomPage — main watch room layout.
 *
 * Layout (from Stitch):
 * - Fixed header (RoomHeader)
 * - Main: flex row
 *   - Video section (flex-1, ~70%)
 *   - Sidebar (fixed 320px–380px, ~30%)
 * - Fixed connection banner
 *
 * On mount: validates room exists via REST API,
 * subscribes to all socket events.
 */
export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [controlRequest, setControlRequest] = useState(null)

  const {
    room, currentUser, setRoom, setCurrentUser,
    setParticipants, setVideoState, addParticipant,
    removeParticipant, updateParticipantRole,
    addChatMessage, addActivityLog, resetRoom, videoState, participants,
    setQueue, setActivePoll,
  } = useRoomContext()

  const { socket, isConnected } = useSocketContext()

  // On mount: validate room and fetch details
  useEffect(() => {
    if (!roomId) return

    const validate = async () => {
      try {
        const data = await getRoom(roomId)
        const { room: fetchedRoom } = data
        if (fetchedRoom) setRoom(fetchedRoom)
      } catch {
        toast.error('Room not found or has expired.')
        navigate('/')
      }
    }

    validate()
  }, [roomId]) // Only run on mount / roomId change

  // Prevent redirect if user session exists in memory or browser storage
  useEffect(() => {
    const hasStoredUser = Boolean(
      sessionStorage.getItem('watchsync_user') || localStorage.getItem('watchsync_user')
    )

    if (!currentUser && !hasStoredUser) {
      navigate('/', { state: { joinRoomId: roomId } })
    }
  }, [currentUser, roomId, navigate])

  // Emit join_room on mount or socket reconnection/refresh
  useEffect(() => {
    let activeUsername = currentUser?.username
    if (!activeUsername) {
      try {
        const stored = sessionStorage.getItem('watchsync_user') || localStorage.getItem('watchsync_user')
        if (stored) activeUsername = JSON.parse(stored)?.username
      } catch {}
    }

    if (!socket || !isConnected || !roomId || !activeUsername) return

    // Re-register user socket into the room
    socket.emit(EVENTS.JOIN_ROOM, {
      roomId,
      username: activeUsername,
    })
  }, [socket, isConnected, roomId, currentUser?.username])

  // Subscribe to all socket events and manage connection/reconnection flow
  useEffect(() => {
    if (!socket || !roomId || !currentUser?.username) return

    socket.on(EVENTS.USER_JOINED, ({ participant }) => {
      soundFx.playJoinChime()
      addParticipant(participant)
      addActivityLog({
        id: `join-${Date.now()}-${Math.random()}`,
        type: 'join',
        username: participant.username,
        text: 'Joined the room',
        timestamp: new Date(),
      })
      if (participant.socketId !== socket.id) {
        toast(`${participant.username} joined the room`, { icon: '👋' })
      }
    })

    socket.on(EVENTS.USER_LEFT, ({ socketId, username }) => {
      soundFx.playLeaveSound()
      removeParticipant(socketId)
      addActivityLog({
        id: `leave-${Date.now()}-${Math.random()}`,
        type: 'leave',
        username,
        text: 'Left the room',
        timestamp: new Date(),
      })
      toast(`${username} left the room`, { icon: '👋' })
    })

    socket.on(EVENTS.SYNC_STATE, ({ participants: updatedList, videoState: vs, room: r, queue, currentUserRole, activePoll: ap }) => {
      if (updatedList) {
        setParticipants(updatedList)
        if (currentUser) {
          const myEntry = updatedList.find(
            p => p.socketId === socket.id || p.username.toLowerCase() === currentUser.username.toLowerCase()
          )
          setCurrentUser({
            ...currentUser,
            socketId: socket.id,
            role: myEntry?.role || currentUserRole || currentUser.role,
          })
        }
      }
      if (vs) setVideoState(vs)
      if (queue) setQueue(queue)
      if (r && !room) setRoom(r)
      if (ap !== undefined) setActivePoll(ap)
      else if (r?.activePoll) setActivePoll(r.activePoll)
    })

    socket.on('poll_updated', ({ activePoll }) => {
      setActivePoll(activePoll)
    })

    socket.on(EVENTS.ROLE_UPDATED, ({ socketId, role, username }) => {
      updateParticipantRole({ socketId, role, username })
      if (socketId === socket.id || (currentUser?.username && currentUser.username.toLowerCase() === username?.toLowerCase())) {
        soundFx.playGrantFanfare()
        toast.success(`Your role was updated to ${role.toUpperCase()}!`, { icon: '👑' })
      } else {
        toast(`${username} is now a ${role.toUpperCase()}`, { icon: '🛡️' })
      }
    })

    socket.on(EVENTS.KICKED, ({ message }) => {
      toast.error(message || 'You were removed from the room by the host.')
      navigate('/')
    })

    socket.on(EVENTS.QUEUE_SYNC, ({ queue }) => {
      if (queue) setQueue(queue)
    })

    socket.on(EVENTS.PLAY, ({ currentTime }) => {
      setVideoState({ isPlaying: true, currentTime })
      addActivityLog({
        id: `play-${Date.now()}`,
        type: 'play',
        username: 'Playback',
        text: 'Resumed video playback',
        timestamp: new Date(),
      })
    })

    socket.on(EVENTS.PAUSE, ({ currentTime }) => {
      setVideoState({ isPlaying: false, currentTime })
      addActivityLog({
        id: `pause-${Date.now()}`,
        type: 'pause',
        username: 'Playback',
        text: 'Paused video playback',
        timestamp: new Date(),
      })
    })

    socket.on(EVENTS.SEEK, ({ currentTime }) => {
      setVideoState({ currentTime })
    })

    socket.on(EVENTS.PLAYBACK_RATE_CHANGED, ({ playbackRate }) => {
      setVideoState({ playbackRate })
      addActivityLog({
        id: `rate-${Date.now()}`,
        type: 'speed',
        username: 'Playback',
        text: `Playback speed set to ${playbackRate}x`,
        timestamp: new Date(),
      })
    })

    socket.on(EVENTS.CHANGE_VIDEO, ({ videoId, title }) => {
      setVideoState({ videoId, isPlaying: false, currentTime: 0 })
      addActivityLog({
        id: `change-${Date.now()}`,
        type: 'queue_add',
        username: 'Host',
        text: `Changed video to "${title || 'new video'}"`,
        timestamp: new Date(),
      })
      toast(`Now playing: ${title || 'new video'}`, { icon: '🎬' })
    })

    socket.on(EVENTS.ROLE_UPDATED, ({ socketId, role, username }) => {
      updateParticipantRole({ socketId, role })
      const roleLabel = { host: 'Host', moderator: 'Moderator', participant: 'Participant', viewer: 'Viewer' }[role] || role
      addActivityLog({
        id: `role-${Date.now()}`,
        type: 'role',
        username,
        text: `Role updated to ${roleLabel}`,
        timestamp: new Date(),
      })
      toast(`${username} is now ${roleLabel}`, { icon: '🔄' })
    })

    socket.on(EVENTS.KICKED, () => {
      toast.error('You were removed from the room.')
      resetRoom()
      navigate('/')
    })

    socket.on(EVENTS.CHAT_MESSAGE, (message) => {
      addChatMessage(message)
    })

    socket.on(EVENTS.ERROR, ({ message }) => {
      toast.error(message || 'An error occurred')
    })

    socket.on('control_requested', (data) => {
      setControlRequest(data)
    })

    // Consolidate join/rejoin logic to prevent race conditions & handle reconnection
    const handleJoin = () => {
      socket.emit(EVENTS.JOIN_ROOM, { roomId, username: currentUser.username })
    }

    if (socket.connected) {
      handleJoin()
    }

    socket.on('connect', handleJoin)

    return () => {
      Object.values(EVENTS).forEach(event => socket.off(event))
      socket.off('control_requested')
      socket.off('connect', handleJoin)
    }
  }, [socket, roomId, currentUser?.username])

  // Sync room state automatically when tab returns to focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socket && roomId) {
        socket.emit(EVENTS.SYNC_REQUEST, { roomId })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [socket, roomId])

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-[#131315] text-[#e5e1e4]">
      {/* Fixed top header */}
      <RoomHeader />

      {/* Main content area — below fixed header */}
      <main className="flex-1 flex pt-[72px] h-full overflow-hidden">
        {/* Video Canvas — left 70% */}
        <section className="flex-1 relative flex flex-col items-center p-4 lg:p-6 bg-[#0e0e10] overflow-y-auto scrollbar-thin">
          {/* Ambient background glow */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-3/4 h-3/4 bg-[#ffb3ad]/10 rounded-full blur-[160px]" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center gap-6 max-w-5xl mx-auto my-auto py-4">
            <QueueInput />
            <VideoPlayer />
            <LivePollOverlay />

            {/* Video metadata & watching count row */}
            <div className="w-full flex justify-between items-start">
              <div>
                <h2 className="font-[Geist,sans-serif] font-semibold text-[20px] tracking-[-0.02em] text-[#e5e1e4] mb-1">
                  {videoState?.title || room?.roomName || 'Watch Party'}
                </h2>
                <div className="flex items-center gap-3 text-[#e4beba] font-[Geist,sans-serif] text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                    <strong className="text-[#e5e1e4]">
                      {new Set(participants.map(p => p.username.toLowerCase().trim())).size || participants.length || 1}
                    </strong> Watching
                  </span>
                  <span>•</span>
                  <span className="text-[#ff5451] font-semibold">Zero-Latency Synced</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar — right 30% */}
        <Sidebar />
      </main>

      {/* Connection status banner */}
      <ConnectionBanner />

      {/* Control Request Modal for Host */}
      <ControlRequestModal
        request={controlRequest}
        onClose={() => setControlRequest(null)}
      />
    </div>
  )
}
