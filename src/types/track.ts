import { z } from 'zod/v4'

// --- Core Types ---

export type DjSoftware = 'rekordbox' | 'traktor' | 'rekordbox-usb' | 'rekordbox-pc' | 'audio-folder'
export type Severity = 'ok' | 'warning' | 'error'
export type MusicalKey = string // "Am", "C#m", "Bb", etc.
export type CamelotKey = string // "8A", "11B", etc.

// --- Zod Schemas (Single Source of Truth) ---

export const TempoMarkerSchema = z.object({
  position: z.number(),
  bpm: z.number(),
  meter: z.string(),
  beat: z.number(),
})

export const CuePointSchema = z.object({
  name: z.string(),
  type: z.enum(['cue', 'loop', 'grid', 'fadein', 'fadeout']),
  start: z.number(),
  end: z.number().optional(),
  hotcue: z.number().optional(),
  color: z
    .object({
      r: z.number(),
      g: z.number(),
      b: z.number(),
    })
    .optional(),
})

export const TrackSchema = z.object({
  id: z.string(),
  source: z.enum(['rekordbox', 'traktor', 'rekordbox-usb', 'rekordbox-pc', 'audio-folder']),
  sourceId: z.string(),

  title: z.string(),
  artist: z.string(),
  album: z.string(),
  genre: z.string(),
  composer: z.string(),
  label: z.string(),
  comment: z.string(),
  year: z.number().nullable(),
  rating: z.number().min(0).max(5),

  duration: z.number(),
  bpm: z.number().nullable(),
  key: z.string().nullable(),
  bitrate: z.number().nullable(),
  sampleRate: z.number().nullable(),
  fileSize: z.number().nullable(),
  fileType: z.string(),

  filePath: z.string(),
  fileName: z.string(),

  tempoMarkers: z.array(TempoMarkerSchema),
  cuePoints: z.array(CuePointSchema),

  dateAdded: z.string().nullable(),

  analysisResults: z.record(z.string(), z.unknown()).optional(),
})

// --- Inferred Types from Schemas ---

export type TempoMarker = z.infer<typeof TempoMarkerSchema>
export type CuePoint = z.infer<typeof CuePointSchema>
export type Track = z.infer<typeof TrackSchema>
