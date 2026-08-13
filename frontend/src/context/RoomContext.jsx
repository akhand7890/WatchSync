import { createContext, useContext, useReducer, useCallback } from 'react'

/**
 * RoomContext — centralized room + participant state.
 *
 * State shape:
 * {
 *   room: { roomId, roomName, hostSocketId } | null
 *   currentUser: { socketId, username, role } | null
 *   participants: Array<{ socketId, username, role }>
 *   videoState: { videoId, isPlaying, currentTime }
 *   chatMessages: Array<{ id, socketId, username, text, timestamp }>
 * }
 */

const RoomContext = createContext(null)

const getInitialUser = () => {
  try {
    const s = sessionStorage.getItem('watchsync_user')
    if (s) return JSON.parse(s)
    const l = localStorage.getItem('watchsync_user')
    if (l) return JSON.parse(l)
  } catch {
    return null
  }
}

const initialState = {
  room: null,
  currentUser: getInitialUser(),
  participants: [],
  videoState: {
    videoId: null,
    isPlaying: false,
    currentTime: 0,
  },
  queue: [],
  chatMessages: [],
  activityLog: [],
  activePoll: null,
}

function roomReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.payload }

    case 'SET_QUEUE':
      return { ...state, queue: action.payload }

    case 'SET_CURRENT_USER': {
      const newUser = typeof action.payload === 'function' ? action.payload(state.currentUser) : action.payload
      if (newUser) {
        try {
          sessionStorage.setItem('watchsync_user', JSON.stringify(newUser))
          localStorage.setItem('watchsync_user', JSON.stringify(newUser))
        } catch {}
      } else {
        try {
          sessionStorage.removeItem('watchsync_user')
          localStorage.removeItem('watchsync_user')
        } catch {}
      }
      return { ...state, currentUser: newUser }
    }

    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload }

    case 'ADD_PARTICIPANT': {
      const exists = state.participants.some(
        p => p.socketId === action.payload.socketId || p.username.toLowerCase() === action.payload.username.toLowerCase()
      )
      if (exists) {
        return {
          ...state,
          participants: state.participants.map(p =>
            (p.socketId === action.payload.socketId || p.username.toLowerCase() === action.payload.username.toLowerCase())
              ? { ...p, ...action.payload }
              : p
          ),
        }
      }
      return { ...state, participants: [...state.participants, action.payload] }
    }

    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.socketId !== action.payload),
      }

    case 'UPDATE_PARTICIPANT_ROLE': {
      const isTargetMe = state.currentUser?.socketId === action.payload.socketId ||
        state.currentUser?.username.toLowerCase() === action.payload.username?.toLowerCase()

      const updatedUser = isTargetMe
        ? { ...state.currentUser, role: action.payload.role }
        : state.currentUser

      if (updatedUser && isTargetMe) {
        try {
          sessionStorage.setItem('watchsync_user', JSON.stringify(updatedUser))
          localStorage.setItem('watchsync_user', JSON.stringify(updatedUser))
        } catch {}
      }

      return {
        ...state,
        participants: state.participants.map(p =>
          (p.socketId === action.payload.socketId || p.username.toLowerCase() === action.payload.username?.toLowerCase())
            ? { ...p, role: action.payload.role }
            : p
        ),
        currentUser: updatedUser,
      }
    }

    case 'SET_VIDEO_STATE':
      return { ...state, videoState: { ...state.videoState, ...action.payload } }

    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload].slice(-200),
      }

    case 'ADD_ACTIVITY':
      return {
        ...state,
        activityLog: [action.payload, ...state.activityLog].slice(0, 100),
      }

    case 'SET_ACTIVITIES':
      return {
        ...state,
        activityLog: action.payload || [],
      }

    case 'SET_ACTIVE_POLL':
      return {
        ...state,
        activePoll: action.payload,
      }

    case 'RESET_ROOM':
      return initialState

    default:
      return state
  }
}

export function RoomProvider({ children }) {
  const [state, dispatch] = useReducer(roomReducer, initialState)

  const isHost = state.currentUser?.role === 'host'
  const isModerator = state.currentUser?.role === 'moderator'
  const canControl = isHost || isModerator

  const setRoom = useCallback((room) => dispatch({ type: 'SET_ROOM', payload: room }), [])
  const setQueue = useCallback((q) => dispatch({ type: 'SET_QUEUE', payload: q }), [])
  const setCurrentUser = useCallback((user) => dispatch({ type: 'SET_CURRENT_USER', payload: user }), [])
  const setParticipants = useCallback((list) => dispatch({ type: 'SET_PARTICIPANTS', payload: list }), [])
  const addParticipant = useCallback((p) => dispatch({ type: 'ADD_PARTICIPANT', payload: p }), [])
  const removeParticipant = useCallback((sid) => dispatch({ type: 'REMOVE_PARTICIPANT', payload: sid }), [])
  const updateParticipantRole = useCallback((data) => dispatch({ type: 'UPDATE_PARTICIPANT_ROLE', payload: data }), [])
  const setVideoState = useCallback((vs) => dispatch({ type: 'SET_VIDEO_STATE', payload: vs }), [])
  const addChatMessage = useCallback((msg) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg }), [])
  const addActivityLog = useCallback((act) => dispatch({ type: 'ADD_ACTIVITY', payload: act }), [])
  const setActivityLog = useCallback((acts) => dispatch({ type: 'SET_ACTIVITIES', payload: acts }), [])
  const setActivePoll = useCallback((poll) => dispatch({ type: 'SET_ACTIVE_POLL', payload: poll }), [])
  const resetRoom = useCallback(() => dispatch({ type: 'RESET_ROOM' }), [])

  return (
    <RoomContext.Provider value={{
      ...state,
      isHost,
      isModerator,
      canControl,
      setRoom,
      setQueue,
      setCurrentUser,
      setParticipants,
      addParticipant,
      removeParticipant,
      updateParticipantRole,
      setVideoState,
      addChatMessage,
      addActivityLog,
      setActivityLog,
      setActivePoll,
      resetRoom,
    }}>
      {children}
    </RoomContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoomContext() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoomContext must be used within <RoomProvider>')
  return ctx
}
