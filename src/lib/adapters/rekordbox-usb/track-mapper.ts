import type { Track } from '@/types/track'
import type { PdbTrack } from './pdb-parser'
import type { AnlzData } from './anlz-parser'

const EMPTY_ANLZ: AnlzData = { tempoMarkers: [], cuePoints: [] }

export function mapPdbTrackToTrack(pdbTrack: PdbTrack, anlz?: AnlzData): Track {
  const anlzData = anlz ?? EMPTY_ANLZ

  return {
    id: `rb-usb-${pdbTrack.id}`,
    source: 'rekordbox-usb',
    sourceId: String(pdbTrack.id),

    title: pdbTrack.title,
    artist: pdbTrack.artist,
    album: pdbTrack.album,
    genre: pdbTrack.genre,
    composer: pdbTrack.composer,
    label: pdbTrack.label,
    comment: pdbTrack.comment,
    year: pdbTrack.year,
    rating: pdbTrack.rating,

    duration: pdbTrack.duration,
    bpm: pdbTrack.bpm,
    key: pdbTrack.key,
    bitrate: pdbTrack.bitrate,
    sampleRate: pdbTrack.sampleRate,
    fileSize: pdbTrack.fileSize,
    fileType: pdbTrack.fileType,

    filePath: pdbTrack.filePath,
    fileName: pdbTrack.fileName,

    tempoMarkers: anlzData.tempoMarkers,
    cuePoints: anlzData.cuePoints,

    dateAdded: pdbTrack.dateAdded,
  }
}
