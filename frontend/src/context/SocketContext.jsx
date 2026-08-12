import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

/**
 * SocketContext — singleton Socket.IO connection.
 *
 * Architecture decision: We create ONE socket for the app lifetime.
 * Reconnection is handled by Socket.IO automatically.
 * The socket only connects when the provider mounts.
 */
const SocketContext = createContext(null)

let socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
if (socketUrl.endsWith('/api')) {
  socketUrl = socketUrl.slice(0, -4)
} else if (socketUrl.endsWith('/api/')) {
  socketUrl = socketUrl.slice(0, -5)
}
const SOCKET_URL = socketUrl

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [latency, setLatency] = useState(12)
  const [transport, setTransport] = useState('WebSocket')

  useEffect(() => {
    // Create the socket — autoConnect: true
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectionError(false)
      if (socket.io?.engine?.transport?.name) {
        setTransport(socket.io.engine.transport.name.toUpperCase())
      }
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', () => {
      setConnectionError(true)
      setIsConnected(false)
    })

    socket.on('reconnect', () => {
      setIsConnected(true)
      setConnectionError(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Periodic latency measurement
  useEffect(() => {
    if (!isConnected || !socketRef.current) return

    const measurePing = () => {
      const start = Date.now()
      socketRef.current.emit('ping_check', () => {
        const ms = Date.now() - start
        setLatency(ms)
      })
    }

    measurePing()
    const interval = setInterval(measurePing, 3000)
    return () => clearInterval(interval)
  }, [isConnected])

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      connectionError,
      latency,
      transport,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocketContext() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocketContext must be used within <SocketProvider>')
  return ctx
}
