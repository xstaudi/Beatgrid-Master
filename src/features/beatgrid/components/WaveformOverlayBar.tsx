'use client'

export type OverlayId = 'grid' | 'kicks' | 'beats' | 'low' | 'mid' | 'high'

export interface OverlayState {
  grid: boolean
  kicks: boolean
  beats: boolean
  low: boolean
  mid: boolean
  high: boolean
}

interface WaveformOverlayBarProps {
  overlays: OverlayState
  onToggle: (id: OverlayId) => void
  hasKickOnsets: boolean
  hasDriftPoints: boolean
  hasDetectedBeats?: boolean
}

const overlayConfig: { id: OverlayId; label: string; color: string; activeClass: string }[] = [
  { id: 'grid', label: 'Grid', color: 'bg-white', activeClass: 'bg-white/20 border-white/40 text-white' },
  { id: 'kicks', label: 'Kicks', color: 'bg-chart-2', activeClass: 'bg-chart-2/20 border-chart-2/40 text-chart-2' },
  { id: 'beats', label: 'Beats', color: 'bg-teal-400', activeClass: 'bg-teal-400/20 border-teal-400/40 text-teal-400' },
]

const bandConfig: { id: OverlayId; label: string; dotColor: string; activeClass: string }[] = [
  { id: 'low', label: 'Low', dotColor: 'bg-[#E4961E]', activeClass: 'bg-[#E4961E]/20 border-[#E4961E]/40 text-[#E4961E]' },
  { id: 'mid', label: 'Mid', dotColor: 'bg-[#E6E2D8]', activeClass: 'bg-[#E6E2D8]/20 border-[#E6E2D8]/40 text-[#E6E2D8]' },
  { id: 'high', label: 'High', dotColor: 'bg-[#4B8CCA]', activeClass: 'bg-[#4B8CCA]/20 border-[#4B8CCA]/40 text-[#4B8CCA]' },
]

export function WaveformOverlayBar({ overlays, onToggle, hasKickOnsets, hasDriftPoints, hasDetectedBeats }: WaveformOverlayBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {overlayConfig.map(({ id, label, color, activeClass }) => {
        if (id === 'kicks' && !hasKickOnsets) return null
        if (id === 'beats' && !hasDriftPoints && !hasDetectedBeats) return null
        const active = overlays[id]
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
              active
                ? activeClass
                : 'border-muted text-muted-foreground hover:border-muted-foreground/50'
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${active ? color : 'bg-muted-foreground/40'}`} />
            {label}
          </button>
        )
      })}
      {/* Separator */}
      <span className="w-px h-4 bg-muted-foreground/20 mx-0.5" />
      {/* Band-Toggles */}
      {bandConfig.map(({ id, label, dotColor, activeClass }) => {
        const active = overlays[id]
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
              active
                ? activeClass
                : 'border-muted text-muted-foreground hover:border-muted-foreground/50'
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${active ? dotColor : 'bg-muted-foreground/40'}`} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
