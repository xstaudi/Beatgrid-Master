import type { Track } from '@/types/track'

export interface TrackClassification {
  verifyCount: number
  freshCount: number
}

/**
 * Klassifiziert Tracks in zwei Modi:
 * - "Fresh": audio-folder Tracks oder Tracks ohne jegliche Analyse-Daten (kein BPM, kein Grid)
 * - "Verify": Bibliotheks-Tracks (rekordbox/traktor) mit vorhandenen Daten
 */
export function classifyTracks(tracks: Track[]): TrackClassification {
  let verifyCount = 0
  let freshCount = 0
  for (const t of tracks) {
    const isAnalyzed = t.bpm !== null || t.tempoMarkers.length > 0
    if (t.source === 'audio-folder' || !isAnalyzed) {
      freshCount++
    } else {
      verifyCount++
    }
  }
  return { verifyCount, freshCount }
}
