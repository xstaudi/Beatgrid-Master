'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { AudioFileHandle } from '@/lib/audio/file-access'

interface UseAudioPlaybackReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  currentTime: number
  duration: number
  canPlay: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
}

export function useAudioPlayback(audioFileHandle: AudioFileHandle | null | undefined): UseAudioPlaybackReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number>(0)
  const blobUrlRef = useRef<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [canPlay, setCanPlay] = useState(false)

  // Create/cleanup blob URL when file handle changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Cleanup previous
    if (blobUrlRef.current) {
      audio.pause()
      audio.src = ''
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setCanPlay(false)
    }

    if (!audioFileHandle?.file) return

    const url = URL.createObjectURL(audioFileHandle.file)
    blobUrlRef.current = url
    audio.src = url

    return () => {
      if (blobUrlRef.current) {
        audio.pause()
        audio.src = ''
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [audioFileHandle])

  // rAF loop for smooth currentTime updates
  const updateTime = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.paused) {
      setCurrentTime(audio.currentTime)
      rafRef.current = requestAnimationFrame(updateTime)
    }
  }, [])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onCanPlay = () => {
      setCanPlay(true)
      setDuration(audio.duration)
    }
    const onPlay = () => {
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(updateTime)
    }
    const onPause = () => {
      setIsPlaying(false)
      cancelAnimationFrame(rafRef.current)
      setCurrentTime(audio.currentTime)
    }
    const onEnded = () => {
      setIsPlaying(false)
      cancelAnimationFrame(rafRef.current)
      setCurrentTime(0)
      audio.currentTime = 0
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [updateTime])

  const play = useCallback(() => {
    audioRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0))
    setCurrentTime(audio.currentTime)
  }, [])

  return { audioRef, isPlaying, currentTime, duration, canPlay, play, pause, toggle, seek }
}
