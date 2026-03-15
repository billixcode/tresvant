import { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react'
import { getPublicUrl, supabase } from '../lib/supabase'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio())
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showSlideshow, setShowSlideshow] = useState(false)

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null
  const audio = audioRef.current

  const savedDurationFor = useRef(null)

  useEffect(() => {
    const a = audio
    const onTimeUpdate = () => setCurrentTime(a.currentTime)
    const onDurationChange = () => {
      const dur = a.duration || 0
      setDuration(dur)
      // Save duration back to DB if track doesn't have one
      const track = currentIndex >= 0 ? queue[currentIndex] : null
      if (track && dur > 0 && isFinite(dur) && !track.duration_secs && savedDurationFor.current !== track.id) {
        savedDurationFor.current = track.id
        const rounded = Math.round(dur)
        supabase.from('tracks').update({ duration_secs: rounded }).eq('id', track.id).then(() => {
          track.duration_secs = rounded
        })
      }
    }
    const onEnded = () => next()
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    a.addEventListener('timeupdate', onTimeUpdate)
    a.addEventListener('durationchange', onDurationChange)
    a.addEventListener('ended', onEnded)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)

    return () => {
      a.removeEventListener('timeupdate', onTimeUpdate)
      a.removeEventListener('durationchange', onDurationChange)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
    }
  }, [currentIndex, queue])

  const playTrack = useCallback((track, trackList) => {
    if (trackList) {
      setQueue(trackList)
      const idx = trackList.findIndex(t => t.id === track.id)
      setCurrentIndex(idx >= 0 ? idx : 0)
    }
    const url = getPublicUrl('audio', track.storage_path)
    audio.src = url
    audio.play()
  }, [audio])

  const play = useCallback(() => audio.play(), [audio])
  const pause = useCallback(() => audio.pause(), [audio])
  const togglePlay = useCallback(() => {
    if (isPlaying) audio.pause()
    else audio.play()
  }, [audio, isPlaying])

  const next = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1
      setCurrentIndex(nextIdx)
      const track = queue[nextIdx]
      audio.src = getPublicUrl('audio', track.storage_path)
      audio.play()
    }
  }, [audio, currentIndex, queue])

  const previous = useCallback(() => {
    if (currentTime > 3) {
      audio.currentTime = 0
    } else if (currentIndex > 0) {
      const prevIdx = currentIndex - 1
      setCurrentIndex(prevIdx)
      const track = queue[prevIdx]
      audio.src = getPublicUrl('audio', track.storage_path)
      audio.play()
    }
  }, [audio, currentIndex, queue, currentTime])

  const seek = useCallback((time) => {
    audio.currentTime = time
  }, [audio])

  const setVolume = useCallback((v) => {
    audio.volume = v
    setVolumeState(v)
    if (v > 0) setIsMuted(false)
  }, [audio])

  const toggleMute = useCallback(() => {
    if (isMuted) {
      audio.muted = false
      setIsMuted(false)
    } else {
      audio.muted = true
      setIsMuted(true)
    }
  }, [audio, isMuted])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(Math.max(0, currentTime - 10))
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(Math.min(duration, currentTime + 10))
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'Escape':
          setShowSlideshow(false)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, toggleMute, currentTime, duration])

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, currentIndex, isPlaying, currentTime, duration,
      volume, isMuted, showSlideshow,
      playTrack, play, pause, togglePlay, next, previous, seek,
      setVolume, toggleMute, setShowSlideshow, setQueue, setCurrentIndex
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
  return context
}
