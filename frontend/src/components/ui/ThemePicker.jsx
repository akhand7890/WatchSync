import { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'

export const THEMES = [
  {
    id: 'purple',
    name: 'Neon Purple',
    icon: '🟣',
    primary: '#863bff',
    accent: '#d0bcff',
    coral: '#ff5451',
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    icon: '🔵',
    primary: '#2563eb',
    accent: '#93c5fd',
    coral: '#3b82f6',
  },
  {
    id: 'green',
    name: 'Emerald Green',
    icon: '🟢',
    primary: '#059669',
    accent: '#6ee7b7',
    coral: '#10b981',
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    icon: '🔴',
    primary: '#dc2626',
    accent: '#fca5a5',
    coral: '#ef4444',
  },
]

/**
 * ThemePicker — dropdown menu to select app accent glow theme.
 */
export default function ThemePicker() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('watchsync_theme') || 'purple'
  })
  const [isOpen, setIsOpen] = useState(false)

  const applyTheme = (themeId) => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0]
    setCurrentTheme(themeId)
    localStorage.setItem('watchsync_theme', themeId)

    // Set data-theme attribute on root html element
    document.documentElement.setAttribute('data-theme', themeId)

    // Set root CSS variables
    document.documentElement.style.setProperty('--color-primary', theme.primary)
    document.documentElement.style.setProperty('--color-accent', theme.accent)
    document.documentElement.style.setProperty('--color-coral', theme.coral)
  }

  useEffect(() => {
    applyTheme(currentTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#201f22]/80 border border-[#5b403e]/30 text-[13px] font-medium text-[#e5e1e4] hover:bg-[#2c2a2e] hover:border-[#ffb3ad]/40 transition-all font-[Geist,sans-serif]"
        title="Change Theme Accent"
      >
        <Palette className="w-4 h-4 text-[#ffb3ad]" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-[#18181b] border border-[#5b403e]/40 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in backdrop-blur-xl">
          <div className="text-[11px] font-semibold text-[#e4beba]/60 px-2 py-1 uppercase tracking-wider font-[Geist,sans-serif]">
            Accent Glow
          </div>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                applyTheme(theme.id)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all font-[Geist,sans-serif] ${
                currentTheme === theme.id
                  ? 'bg-[#27272a] text-[#ffb3ad] border border-[#ffb3ad]/20'
                  : 'text-[#e5e1e4] hover:bg-[#201f22]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{theme.icon}</span>
                <span>{theme.name}</span>
              </span>
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: theme.coral }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
