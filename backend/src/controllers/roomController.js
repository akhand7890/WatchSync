const roomService = require('../services/roomService')

/**
 * POST /api/rooms/create
 * Creates a new room and returns it.
 */
async function createRoom(req, res, next) {
  try {
    const { username, roomName, isPrivate, password } = req.body

    if (!username?.trim())  return res.status(400).json({ message: 'Username is required.' })
    if (!roomName?.trim())  return res.status(400).json({ message: 'Room name is required.' })
    if (username.length > 24) return res.status(400).json({ message: 'Username too long (max 24).' })
    if (roomName.length > 60) return res.status(400).json({ message: 'Room name too long (max 60).' })
    if (isPrivate && !password?.trim()) return res.status(400).json({ message: 'Password/PIN is required for private rooms.' })

    const room = await roomService.createRoom({
      username: username.trim(),
      roomName: roomName.trim(),
      isPrivate: Boolean(isPrivate),
      password: password ? password.trim() : null,
    })

    return res.status(201).json({
      success: true,
      room: {
        roomId:    room.roomId,
        roomName:  room.roomName,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/rooms/join
 * Validates a room exists and returns its current state.
 */
async function joinRoom(req, res, next) {
  try {
    const { username, roomId } = req.body

    if (!username?.trim()) return res.status(400).json({ message: 'Username is required.' })
    if (!roomId?.trim())   return res.status(400).json({ message: 'Room code is required.' })

    const room = await roomService.findRoom(roomId.trim())

    return res.status(200).json({
      success: true,
      room: {
        roomId:      room.roomId,
        roomName:    room.roomName,
        videoState:  room.videoState,
        hostSocketId: room.hostSocketId,
        participantCount: room.participants.length,
      },
    })
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message })
    }
    next(err)
  }
}

/**
 * GET /api/rooms/:id
 * Fetch full room details.
 */
async function getRoom(req, res, next) {
  try {
    const room = await roomService.findRoom(req.params.id)

    return res.status(200).json({
      success: true,
      room: {
        roomId:       room.roomId,
        roomName:     room.roomName,
        hostSocketId: room.hostSocketId,
        videoState:   room.videoState,
        participants: room.participants.map(p => ({
          socketId: p.socketId,
          username: p.username,
          role:     p.role,
          status:   p.status,
        })),
        participantCount: room.participants.length,
        createdAt:    room.createdAt,
      },
    })
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message })
    }
    next(err)
  }
}

/**
 * GET /api/rooms
 * List all active rooms.
 */
async function getRooms(req, res, next) {
  try {
    const rooms = await roomService.getAllRooms()
    
    const mappedRooms = rooms.map(room => {
      const hostParticipant = room.participants.find(p => p.role === 'host')
      const hostName = hostParticipant ? hostParticipant.username : 'Unknown'
      
      let status = 'Active'
      if (room.participants.length === 0) {
        status = 'Empty'
      } else if (room.videoState?.videoId) {
        status = room.videoState.isPlaying ? 'Playing' : 'Waiting'
      } else {
        status = 'Waiting'
      }

      return {
        roomId:           room.roomId,
        roomName:         room.roomName,
        hostName,
        hostSocketId:     room.hostSocketId,
        participantCount: room.participants.length,
        currentVideoTitle: room.videoState?.title || '',
        currentVideoId:   room.videoState?.videoId || null,
        createdAt:        room.createdAt,
        status,
      }
    })

    return res.status(200).json({
      success: true,
      rooms: mappedRooms,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/rooms/:id
 * Delete a room (only by its host).
 */
async function deleteRoom(req, res, next) {
  try {
    const { socketId } = req.body
    const roomId = req.params.id

    if (!socketId) {
      return res.status(400).json({ message: 'Host Socket ID is required to verify permissions.' })
    }

    const room = await roomService.findRoom(roomId)
    
    // Check if requester is the host of this room
    if (room.hostSocketId && room.hostSocketId !== socketId) {
      return res.status(403).json({ message: 'Only the host is authorized to delete this room.' })
    }

    // Kick all clients currently inside the room
    const io = req.app.get('io')
    if (io) {
      io.to(roomId).emit('kicked')
    }

    await roomService.deleteRoom(roomId)

    // Notify all dashboard pages that the rooms list updated
    if (io) {
      io.emit('rooms_updated')
    }

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully.',
    })
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message })
    }
    next(err)
  }
}

/**
 * GET /api/youtube/search?q=query
 * Scrapes YouTube search results directly on backend with zero CORS restrictions.
 */
async function searchYouTube(req, res, next) {
  try {
    const query = req.query.q
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required.' })
    }

    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })
    const html = await response.text()

    const match = html.match(/ytInitialData\s*=\s*({.+?});\s*<\/script>/)
    let results = []

    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1])
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || []

        for (const item of contents) {
          const video = item.videoRenderer
          if (video && video.videoId) {
            results.push({
              videoId: video.videoId,
              title: video.title?.runs?.[0]?.text || 'YouTube Video',
              uploaderName: video.ownerText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || 'YouTube Channel',
              thumbnail: video.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
              duration: video.lengthText?.simpleText || '',
            })
          }
        }
      } catch (err) {
        console.error('[YouTube Search] JSON parse error:', err.message)
      }
    }

    // Fallback if scraping yielded no results
    if (results.length === 0) {
      const instances = [
        `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        `https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=all`,
      ]
      for (const endpoint of instances) {
        try {
          const fallbackRes = await fetch(endpoint)
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json()
            const items = Array.isArray(fallbackData) ? fallbackData : (fallbackData.items || [])
            results = items.map(item => {
              const videoId = item.videoId || (item.url ? item.url.replace('/watch?v=', '') : item.id)
              return {
                videoId,
                title: item.title,
                uploaderName: item.author || item.uploaderName || 'YouTube',
                thumbnail: item.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                duration: item.lengthSeconds || item.duration || 0,
              }
            }).filter(item => item.videoId)
            if (results.length > 0) break
          }
        } catch {}
      }
    }

    return res.status(200).json({
      success: true,
      items: results.slice(0, 20),
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { createRoom, joinRoom, getRoom, getRooms, deleteRoom, searchYouTube }
