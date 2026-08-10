/**
 * soundEffects.js — Web Audio API Synthesizer
 * Synthesizes zero-latency UI sound effects using Web Audio API (no external MP3/WAV files required).
 * Includes automatic browser AudioContext unlocking on first user interaction.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null
    this.isMuted = localStorage.getItem('watchsync_sfx_muted') === 'true'
    this.setupAutoUnlock()
  }

  setupAutoUnlock() {
    if (typeof window === 'undefined') return
    const unlock = () => {
      this.init()
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume()
      }
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
    window.addEventListener('click', unlock, { passive: true })
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    localStorage.setItem('watchsync_sfx_muted', String(this.isMuted))
    return this.isMuted
  }

  // 🎈 Reaction Pop Sound (bubble pitch sweep)
  playReactionPop() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      const now = this.ctx.currentTime

      // Pitch sweep up (400Hz -> 850Hz)
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.08)

      // Envelope fade out
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.08)
    } catch {}
  }

  // 🔔 User Join Chime (Harmonious dual-tone)
  playJoinChime() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25] // C5 -> E5

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        const startTime = now + idx * 0.08

        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.2, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.25)
      })
    } catch {}
  }

  // 👋 User Leave Sound (Descending soft tone)
  playLeaveSound() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      const now = this.ctx.currentTime

      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15) // C5 -> C4

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch {}
  }

  // 💬 Chat Message Pop
  playChatPop() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      const now = this.ctx.currentTime

      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.05)
    } catch {}
  }

  // 👑 Permission Granted Fanfare
  playGrantFanfare() {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        const startTime = now + idx * 0.06

        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.25, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.3)
      })
    } catch {}
  }
}

export const soundFx = new SoundSynthesizer()
