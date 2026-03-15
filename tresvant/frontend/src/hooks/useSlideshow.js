import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, getPublicUrl } from '../lib/supabase'

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useSlideshow(isPlaying) {
  const [photos, setPhotos] = useState([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const intervalRef = useRef(null)

  // Fetch featured photos once
  useEffect(() => {
    async function fetchPhotos() {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('featured', true)
      if (data && data.length > 0) {
        setPhotos(shuffle(data))
      }
      setLoaded(true)
    }
    fetchPhotos()
  }, [])

  // Cycle photos every 5 seconds when playing
  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentPhotoIndex(prev => (prev + 1) % photos.length)
      }, 5000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, photos.length])

  const currentPhoto = photos.length > 0 ? photos[currentPhotoIndex] : null
  const photoUrl = currentPhoto ? getPublicUrl('photos', currentPhoto.storage_path) : null

  return { currentPhoto, photoUrl, hasPhotos: photos.length > 0, loaded }
}
