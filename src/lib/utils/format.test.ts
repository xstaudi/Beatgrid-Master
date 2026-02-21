import { describe, it, expect } from 'vitest'
import { formatDuration, formatBitrate, formatFileSize } from './format'

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(225)).toBe('3:45')
  })

  it('pads seconds with leading zero', () => {
    expect(formatDuration(61)).toBe('1:01')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('handles large durations', () => {
    expect(formatDuration(3661)).toBe('61:01')
  })

  it('floors fractional seconds', () => {
    expect(formatDuration(125.7)).toBe('2:05')
  })
})

describe('formatBitrate', () => {
  it('formats kbps', () => {
    expect(formatBitrate(320)).toBe('320 kbps')
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(4.2 * 1024 * 1024)).toBe('4.2 MB')
  })

  it('formats gigabytes', () => {
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
  })
})
