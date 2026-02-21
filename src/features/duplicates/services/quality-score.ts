import type { Track } from '@/types/track'
import {
  FORMAT_QUALITY_TIERS,
  QUALITY_WEIGHT_BITRATE,
  QUALITY_WEIGHT_FORMAT,
  QUALITY_WEIGHT_FILESIZE,
} from '../constants'

const MAX_BITRATE = 320

/**
 * Compute a quality score (0-100) for a track based on:
 * - Bitrate (60% weight)
 * - Format tier (25% weight)
 * - File size (15% weight)
 */
export function computeQualityScore(track: Track): number {
  // Bitrate score: normalized to 0-100 with 320kbps as max
  const bitrateScore = track.bitrate
    ? Math.min(100, (track.bitrate / MAX_BITRATE) * 100)
    : 50

  // Format score from tier map
  const fileType = track.fileType.toLowerCase().replace(/^\./, '')
  const formatScore = FORMAT_QUALITY_TIERS[fileType] ?? 50

  // File size score: larger = better (proxy for less compression)
  // Normalize relative to duration — bytes per second
  const bytesPerSecond = track.fileSize && track.duration > 0
    ? track.fileSize / track.duration
    : 0
  // ~40KB/s (320kbps) as reference point for max quality
  const fileSizeScore = bytesPerSecond > 0
    ? Math.min(100, (bytesPerSecond / 40000) * 100)
    : 50

  return Math.round(
    bitrateScore * QUALITY_WEIGHT_BITRATE +
    formatScore * QUALITY_WEIGHT_FORMAT +
    fileSizeScore * QUALITY_WEIGHT_FILESIZE,
  )
}
