import { describe, it, expect } from 'vitest'
import { detectDrop } from './drop-detection'

function generateKicksEveryBeat(
  bpm: number,
  startSec: number,
  endSec: number,
): number[] {
  const interval = 60 / bpm
  const kicks: number[] = []
  let pos = startSec
  while (pos < endSec) {
    kicks.push(pos)
    pos += interval
  }
  return kicks
}

describe('detectDrop', () => {
  const bpm = 128
  const interval = 60 / bpm
  const barLen = interval * 4
  const duration = 300 // 5 Minuten

  it('erkennt typischen EDM-Drop: Intro-Kicks → Breakdown → Drop', () => {
    // 32 Bars Intro mit Kicks
    const introKicks = generateKicksEveryBeat(bpm, 0, 32 * barLen)
    // 16 Bars Breakdown: keine Kicks
    const breakdownEnd = 32 * barLen + 16 * barLen
    // Drop: Kicks ab hier
    const dropKicks = generateKicksEveryBeat(bpm, breakdownEnd, duration)

    const allKicks = [...introKicks, ...dropKicks]
    const result = detectDrop(allKicks, bpm, duration)

    expect(result.dropKickSec).not.toBeNull()
    expect(result.confidence).not.toBe('none')
    // Erster Kick im Drop
    expect(result.dropKickSec).toBeCloseTo(breakdownEnd, 1)
  })

  it('gibt null zurueck bei Track ohne Drop (durchgehend Kicks)', () => {
    const kicks = generateKicksEveryBeat(bpm, 0, duration)
    const result = detectDrop(kicks, bpm, duration)

    expect(result.dropKickSec).toBeNull()
    expect(result.confidence).toBe('none')
  })

  it('gibt null zurueck bei leeren Kick-Onsets', () => {
    const result = detectDrop([], bpm, duration)

    expect(result.dropKickSec).toBeNull()
    expect(result.confidence).toBe('none')
  })

  it('erkennt ersten Drop bei mehreren Drops', () => {
    // 16 Bars Kicks → 16 Bars Breakdown → Drop 1 → 16 Bars Breakdown → Drop 2
    const part1 = generateKicksEveryBeat(bpm, 0, 16 * barLen)
    const breakdown1End = 16 * barLen + 16 * barLen
    const drop1 = generateKicksEveryBeat(bpm, breakdown1End, breakdown1End + 32 * barLen)
    const breakdown2End = breakdown1End + 32 * barLen + 16 * barLen
    const drop2 = generateKicksEveryBeat(bpm, breakdown2End, duration)

    const allKicks = [...part1, ...drop1, ...drop2]
    const result = detectDrop(allKicks, bpm, duration)

    expect(result.dropKickSec).not.toBeNull()
    // Muss der erste Drop sein, nicht der zweite
    expect(result.dropKickSec!).toBeCloseTo(breakdown1End, 1)
  })

  it('gibt null zurueck bei ungueltigem BPM', () => {
    const kicks = generateKicksEveryBeat(128, 0, 60)
    expect(detectDrop(kicks, 0, 60).dropKickSec).toBeNull()
    expect(detectDrop(kicks, -1, 60).dropKickSec).toBeNull()
  })
})
