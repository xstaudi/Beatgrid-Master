'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

// Extracted from Figma: bar heights normalized to max (42.273px)
// 32 bars, 4px wide, 7px gap
const BAR_HEIGHTS = [
  0.707, 0.339, 0.885, 0.606, 0.237, 0.683, 0.405, 0.381,
  0.912, 0.271, 0.745, 0.239, 0.249, 0.525, 0.289, 0.900,
  1.000, 0.625, 0.433, 0.563, 0.237, 0.564, 0.861, 0.268,
  0.683, 0.725, 0.509, 0.247, 0.313, 0.563, 0.577, 0.234,
]

const BAR_GRADIENT =
  'linear-gradient(180deg, rgb(255,255,255) 0%, rgb(255,183,0) 35%, rgb(255,140,0) 50%, rgb(255,183,0) 65%, rgb(255,255,255) 100%)'

interface WaveformLoaderProps {
  className?: string
}

export function WaveformLoader({ className }: WaveformLoaderProps) {
  const maxH = 42

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {/* Outer container - glass card */}
      <div className="rounded-3xl border border-white/10 bg-neutral-900/50 p-12 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)]">
        {/* Inner black panel with orange glow */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0px_0px_40px_-10px_rgba(255,165,0,0.3)]">
          {/* Top border shine */}
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

          {/* Waveform bars */}
          <div className="flex items-center justify-center gap-[3px] px-6 py-12">
            {BAR_HEIGHTS.map((h, i) => {
              const barH = h * maxH
              const delay = i * 0.06

              return (
                <div key={i} className="relative flex items-center" style={{ height: maxH }}>
                  {/* Blue background bar (blur glow) */}
                  <motion.div
                    className="absolute rounded-full bg-[#155dfc] opacity-80 blur-[1px]"
                    style={{ width: 4, height: barH * 0.7 }}
                    animate={{ scaleY: [0.7, 1.2, 0.7] }}
                    transition={{
                      duration: 2.0,
                      repeat: Infinity,
                      delay,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Gradient foreground bar */}
                  <motion.div
                    className="relative rounded-full shadow-[0px_0px_10px_0px_rgba(255,165,0,0.4)]"
                    style={{
                      width: 4,
                      height: barH,
                      backgroundImage: BAR_GRADIENT,
                    }}
                    animate={{ scaleY: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: delay + 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Vignette overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 20%, black 100%)',
            }}
          />

          {/* Scanline */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-white/10 to-transparent"
            animate={{ left: ['-2%', '102%'] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Bottom border shine */}
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  )
}
