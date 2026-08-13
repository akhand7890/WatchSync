import axios from 'axios'

/**
 * api.js — Axios instance for backend REST calls.
 * Base URL reads from env or defaults to proxied /api.
 */
let baseUrl = import.meta.env.VITE_API_URL || 'https://watchsync-impu.onrender.com/api'
if (!baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  baseUrl = `${baseUrl.replace(/\/$/, '')}/api`
}

console.log('[WatchSync API] Target Base URL:', baseUrl)

const api = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000, // 45 seconds to handle Render free tier cold-start spin-ups
})

// Response interceptor — unwrap data or throw structured error
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = error.response?.data?.message || error.message || 'Something went wrong'
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Server is waking up from sleep (Render free tier cold start). Please wait 10 seconds and try clicking Create Party again!'
    } else if (error.message === 'Network Error') {
      message = `Network Error: Unable to connect to backend at ${baseUrl}. The server may be starting up—please try again in a few seconds.`
    }
    return Promise.reject(new Error(message))
  }
)

/* --- Room API --- */

/**
 * Create a new room.
 * @param {{ username: string, roomName: string }} data
 */
export const createRoom = (data) => api.post('/rooms/create', data)

/**
 * Join an existing room.
 * @param {{ username: string, roomId: string }} data
 */
export const joinRoom = (data) => api.post('/rooms/join', data)

/**
 * Fetch room details by ID.
 * @param {string} roomId
 */
export const getRoom = (roomId) => api.get(`/rooms/${roomId}`)

/**
 * Fetch all active rooms.
 */
export const getRooms = () => api.get('/rooms')

/**
 * Delete a room (only by host).
 * @param {string} roomId
 * @param {string} socketId
 */
export const deleteRoom = (roomId, socketId) => api.delete(`/rooms/${roomId}`, { data: { socketId } })

export default api
