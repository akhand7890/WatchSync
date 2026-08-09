# WatchSync 🎬

> **Synchronized Cinema, In Perfect Real-Time.**  
> Crafted with ❤️ by **Akhand**

[![Author](https://img.shields.io/badge/Author-Akhand-ff5451?style=for-the-badge&logo=github)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](./LICENSE)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)

**WatchSync** is a premium, real-time YouTube Watch Party application designed and developed by **Akhand**. Built on a scalable MERN stack & WebSockets architecture, it enables users to watch videos together with zero-latency synchronization, interactive emoji reactions, private password-protected rooms, queue upvoting, and live event timelines.

The user interface implements the **"Synchronous Dark Media System"** design language, using a theatrical, glassmorphic aesthetic built with Tailwind CSS and Framer Motion.

---

## 👨‍💻 Developer & Author

- **Lead Architect & Developer**: **Akhand**
- **Project Name**: WatchSync
- **License**: MIT License (© 2026 Akhand)

---

## ✨ Key Features & Highlights

- 🍿 **Zero-Latency Video Synchronization**: Sub-second play, pause, seek, and speed sync across all connected clients.
- 🔒 **Private Rooms**: Secure room creation with optional PIN / password authentication.
- ⏩ **Synchronized Playback Speed**: Change playback rate (0.5x, 1x, 1.25x, 1.5x, 2.0x) in sync across all viewers.
- 🔍 **Instant In-App YouTube Search**: Search YouTube videos by keyword directly within the app without leaving your room.
- 👍 **Queue Upvoting & Auto-Sorting**: Crowd-favorite voting system that automatically re-sorts queued videos in real-time.
- 📜 **Live Room Activity Feed**: Real-time event timeline logging joins, leaves, playback actions, and role updates.
- 👑 **Host Permission Request System**: Participants can request control from the Host with 1-click pop-up approvals.
- 🎈 **Live Floating Emoji Reactions**: Real-time floating emojis (❤️, 🔥, 👏, 🍿, 🚀, 😂) rendered live over the video canvas.
- 🎨 **Theme Accent Color Switcher**: Switch UI glows between Neon Purple, Electric Blue, Emerald Green, and Crimson Red.

---

## 🛠️ Tech Stack & Key Technologies

### Frontend
- **React 19 & Vite** — High-speed Hot Module Replacement (HMR) and concurrent UI rendering.
- **Tailwind CSS v4** — Styled using token-matched themes and glassmorphic utilities.
- **Framer Motion** — Micro-animations for card transitions, modals, and reaction canvas.
- **Socket.IO Client** — Manages persistent bi-directional connection with automated reconnection.
- **React Hook Form** — Validates login and room forms without unnecessary re-renders.

### Backend
- **Node.js & Express** — Lightweight and modular controller-service-routing architecture.
- **MongoDB & Mongoose** — Stores ephemeral rooms with automatic 24-hour expiration (TTL index).
- **Socket.IO** — Manages real-time room channels, presence, and event broadcasts.
- **Custom DNS Resolution** — Configured to bypass local ISP resolver restrictions when connecting to MongoDB Atlas.

---

## 🔌 Quick Start & Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/WatchSync.git
cd WatchSync

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.vu1yat7.mongodb.net/watchsync?appName=Cluster0
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

Run the backend server (starts Express on port `5000` and connects to MongoDB Atlas):
```bash
cd backend
npm run dev
```

Run the frontend server (runs Vite dev server on port `5173`):
```bash
cd ../frontend
npm run dev
```

Open **http://localhost:5173** to access the application.

---

## 🏗️ Architecture & Project Structure

```
WatchSync/
├── frontend/                       # Client codebase
│   └── src/
│       ├── components/
│       │   ├── landing/            # HeroSection, FeaturesGrid
│       │   ├── layout/             # Navbar, Footer
│       │   ├── modals/             # CreateRoomModal, JoinRoomModal, YouTubeSearchModal, ControlRequestModal
│       │   ├── room/               # VideoPlayer, VideoControls, Chat, Sidebar, QueueList, ActivityTimeline
│       │   └── ui/                 # Avatar, Badge, Button, ThemePicker
│       ├── context/                # SocketContext, RoomContext
│       ├── services/               # api.js (Axios), socketService.js (Emitters)
│       └── styles/                 # globals.css (Tailwind theme tokens & glass effects)
│
├── backend/                        # API & WebSocket codebase
│   ├── src/
│   │   ├── config/                 # db.js (Mongoose config + DNS overrides)
│   │   ├── controllers/            # roomController.js (REST handlers)
│   │   ├── models/                 # Room.js (embedded schemas)
│   │   ├── routes/                 # roomRoutes.js
│   │   ├── services/               # roomService.js (State database logic)
│   │   └── socket/                 # index.js (IO initialization), roomHandlers.js
│   └── server.js                   # Application entry point
```

---

## 📜 License & Copyright

Designed, created, and maintained by **Akhand**.  
Licensed under the [MIT License](./LICENSE).

© 2026 **Akhand**. All Rights Reserved.
