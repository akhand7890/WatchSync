import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { SocketProvider } from './context/SocketContext'
import { RoomProvider } from './context/RoomContext'
import LandingPage from './pages/LandingPage'
import RoomsPage from './pages/RoomsPage'
import RoomPage from './pages/RoomPage'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('WatchSync Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#18181b', color: '#ffb3ad', fontFamily: 'sans-serif', minHeight: '100vh' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff5451', marginBottom: '16px' }}>
            ⚠️ WatchSync Caught an Error:
          </h2>
          <pre style={{ background: '#09090b', padding: '20px', borderRadius: '12px', color: '#e5e1e4', overflowX: 'auto', border: '1px solid #5b403e' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{ marginTop: '20px', padding: '12px 24px', background: '#ff5451', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Return to Home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * App — root router wrapped in ErrorBoundary.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SocketProvider>
          <RoomProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
            </Routes>

            {/* Global toast container */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'rgba(17, 24, 39, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid #27272A',
                  color: '#e5e1e4',
                  fontFamily: 'Geist, sans-serif',
                  fontSize: '14px',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: { primary: '#ffb3ad', secondary: '#68000a' },
                },
                error: {
                  iconTheme: { primary: '#ffb4ab', secondary: '#690005' },
                },
              }}
            />
          </RoomProvider>
        </SocketProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
