import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { applyFixes } from './mutation-engine'
import type { FixOperation } from '@/types/fix'

const rbXml = readFileSync(
  resolve(__dirname, '../../test/fixtures/rekordbox-sample.xml'),
  'utf-8',
)

const tkXml = readFileSync(
  resolve(__dirname, '../../test/fixtures/traktor-sample.nml'),
  'utf-8',
)

function resultDoc(xmlContent: string): Document {
  return new DOMParser().parseFromString(xmlContent, 'text/xml')
}

describe('Mutation Engine', () => {
  describe('Roundtrip', () => {
    it('should produce valid XML with 0 operations (rekordbox)', () => {
      const result = applyFixes(rbXml, [], 'rekordbox')
      expect(result.appliedCount).toBe(0)
      expect(result.skippedTrackIds).toEqual([])
      const doc = resultDoc(result.xmlContent)
      const tracks = doc.querySelectorAll('COLLECTION > TRACK')
      expect(tracks.length).toBe(4)
    })

    it('should produce valid XML with 0 operations (traktor)', () => {
      const result = applyFixes(tkXml, [], 'traktor')
      expect(result.appliedCount).toBe(0)
      expect(result.skippedTrackIds).toEqual([])
      const doc = resultDoc(result.xmlContent)
      const entries = doc.querySelectorAll('COLLECTION > ENTRY')
      expect(entries.length).toBe(4)
    })
  })

  describe('Rekordbox', () => {
    it('should fix BPM (AverageBpm + TEMPO@Bpm)', () => {
      const ops: FixOperation[] = [
        { kind: 'bpm', trackId: 'rb-1', sourceId: '1', detectedBpm: 125.5 },
      ]
      const result = applyFixes(rbXml, ops, 'rekordbox')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const track = doc.querySelector('TRACK[TrackID="1"]')!
      expect(track.getAttribute('AverageBpm')).toBe('125.50')
      const tempo = track.querySelector('TEMPO')!
      expect(tempo.getAttribute('Bpm')).toBe('125.50')
    })

    it('should fix Key (Tonality)', () => {
      const ops: FixOperation[] = [
        { kind: 'key', trackId: 'rb-2', sourceId: '2', detectedKey: 'Cm' },
      ]
      const result = applyFixes(rbXml, ops, 'rekordbox')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const track = doc.querySelector('TRACK[TrackID="2"]')!
      expect(track.getAttribute('Tonality')).toBe('Cm')
    })

    it('should fix Beatgrid (TEMPO@Inizio)', () => {
      const ops: FixOperation[] = [
        { kind: 'beatgrid', trackId: 'rb-1', sourceId: '1', newDownbeatSec: 0.145 },
      ]
      const result = applyFixes(rbXml, ops, 'rekordbox')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const track = doc.querySelector('TRACK[TrackID="1"]')!
      const tempo = track.querySelector('TEMPO')!
      expect(tempo.getAttribute('Inizio')).toBe('0.145')
    })

    it('should remove duplicate track and decrement Entries', () => {
      const ops: FixOperation[] = [
        { kind: 'duplicate-remove', trackId: 'rb-4', sourceId: '4', groupId: 'test' },
      ]
      const result = applyFixes(rbXml, ops, 'rekordbox')
      expect(result.appliedCount).toBe(1)
      expect(result.removedTrackIds).toContain('rb-4')

      const doc = resultDoc(result.xmlContent)
      const tracks = doc.querySelectorAll('COLLECTION > TRACK')
      expect(tracks.length).toBe(3)
      const collection = doc.querySelector('COLLECTION')!
      expect(collection.getAttribute('Entries')).toBe('3')
    })
  })

  describe('Traktor', () => {
    it('should fix BPM with 6 decimals', () => {
      const ops: FixOperation[] = [
        { kind: 'bpm', trackId: 'tr-abc123', sourceId: 'abc123', detectedBpm: 127.5 },
      ]
      const result = applyFixes(tkXml, ops, 'traktor')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const entry = doc.querySelector('ENTRY[AUDIO_ID="abc123"]')!
      const tempo = entry.querySelector('TEMPO')!
      expect(tempo.getAttribute('BPM')).toBe('127.500000')
    })

    it('should fix Key mismatch (MUSICAL_KEY@VALUE via reverse map)', () => {
      const ops: FixOperation[] = [
        { kind: 'key', trackId: 'tr-ghi789', sourceId: 'ghi789', detectedKey: 'Am' },
      ]
      const result = applyFixes(tkXml, ops, 'traktor')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const entry = doc.querySelector('ENTRY[AUDIO_ID="ghi789"]')!
      const musicalKey = entry.querySelector('MUSICAL_KEY')!
      expect(musicalKey.getAttribute('VALUE')).toBe('21')
    })

    it('should create MUSICAL_KEY element when missing', () => {
      const ops: FixOperation[] = [
        { kind: 'key', trackId: 'tr-def456', sourceId: 'def456', detectedKey: 'Cm' },
      ]
      const result = applyFixes(tkXml, ops, 'traktor')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const entry = doc.querySelector('ENTRY[AUDIO_ID="def456"]')!
      const musicalKey = entry.querySelector('MUSICAL_KEY')!
      expect(musicalKey).not.toBeNull()
      expect(musicalKey.getAttribute('VALUE')).toBe('12')
    })

    it('should fix Beatgrid (CUE_V2[TYPE=4]@START in ms)', () => {
      const ops: FixOperation[] = [
        { kind: 'beatgrid', trackId: 'tr-abc123', sourceId: 'abc123', newDownbeatSec: 0.15 },
      ]
      const result = applyFixes(tkXml, ops, 'traktor')
      expect(result.appliedCount).toBe(1)

      const doc = resultDoc(result.xmlContent)
      const entry = doc.querySelector('ENTRY[AUDIO_ID="abc123"]')!
      const gridCue = Array.from(entry.querySelectorAll('CUE_V2')).find(
        (c) => c.getAttribute('TYPE') === '4',
      )!
      expect(gridCue.getAttribute('START')).toBe('150.0')
    })
  })

  describe('Edge Cases', () => {
    it('should skip unknown trackId and report it', () => {
      const ops: FixOperation[] = [
        { kind: 'bpm', trackId: 'rb-999', sourceId: '999', detectedBpm: 130 },
      ]
      const result = applyFixes(rbXml, ops, 'rekordbox')
      expect(result.appliedCount).toBe(0)
      expect(result.skippedTrackIds).toContain('rb-999')
    })

    it('should apply multiple fixes to different tracks', () => {
      const ops: FixOperation[] = [
        { kind: 'bpm', trackId: 'rb-1', sourceId: '1', detectedBpm: 126 },
        { kind: 'key', trackId: 'rb-2', sourceId: '2', detectedKey: 'Dm' },
        { kind: 'bpm', trackId: 'rb-3', sourceId: '3', detectedBpm: 141 },
      ]
      const result = applyFixes(rbXml, ops, 'rekordbox')
      expect(result.appliedCount).toBe(3)
      expect(result.skippedTrackIds).toEqual([])
    })
  })
})
