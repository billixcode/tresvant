import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MAX_CONCURRENT = 3

export function useUploadQueue() {
  const [files, setFiles] = useState([])
  const [statuses, setStatuses] = useState({})
  const [uploadedTracks, setUploadedTracks] = useState([])
  const [allDone, setAllDone] = useState(false)
  const activeCount = useRef(0)
  const queueRef = useRef([])

  const addFiles = useCallback((newFiles) => {
    const fileList = Array.from(newFiles).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return ['mp3', 'flac', 'wav', 'm4a', 'ogg'].includes(ext)
    })
    setFiles(prev => [...prev, ...fileList])
    const newStatuses = {}
    fileList.forEach(f => { newStatuses[f.name] = 'queued' })
    setStatuses(prev => ({ ...prev, ...newStatuses }))
  }, [])

  const processNext = useCallback(async () => {
    if (activeCount.current >= MAX_CONCURRENT || queueRef.current.length === 0) {
      if (activeCount.current === 0 && queueRef.current.length === 0) {
        setAllDone(true)
      }
      return
    }

    activeCount.current++
    const file = queueRef.current.shift()

    setStatuses(prev => ({ ...prev, [file.name]: 'uploading' }))

    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const uuid = crypto.randomUUID()
      const storagePath = `tracks/${uuid}.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      // Create draft track record
      const fallbackTitle = file.name.replace(/\.[^/.]+$/, '')
      const { data: track, error: insertError } = await supabase
        .from('tracks')
        .insert({
          title: fallbackTitle,
          storage_path: storagePath,
          status: 'draft'
        })
        .select()
        .single()

      if (insertError) throw insertError

      setStatuses(prev => ({ ...prev, [file.name]: 'extracting' }))

      // Call edge function for metadata extraction
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('extract-metadata', {
          body: { storage_path: storagePath, track_id: track.id }
        })

        if (fnError) console.warn('Metadata extraction failed:', fnError)
      } catch (e) {
        console.warn('Metadata extraction error:', e)
      }

      // Refresh the track data after extraction
      const { data: updatedTrack } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', track.id)
        .single()

      setUploadedTracks(prev => [...prev, updatedTrack || track])
      setStatuses(prev => ({ ...prev, [file.name]: 'ready' }))
    } catch (err) {
      console.error('Upload failed:', file.name, err)
      setStatuses(prev => ({ ...prev, [file.name]: 'error' }))
    }

    activeCount.current--
    processNext()
  }, [])

  const startUpload = useCallback(() => {
    queueRef.current = [...files]
    setAllDone(false)
    // Start up to MAX_CONCURRENT uploads
    for (let i = 0; i < MAX_CONCURRENT; i++) {
      processNext()
    }
  }, [files, processNext])

  const reset = useCallback(() => {
    setFiles([])
    setStatuses({})
    setUploadedTracks([])
    setAllDone(false)
    activeCount.current = 0
    queueRef.current = []
  }, [])

  return { files, statuses, uploadedTracks, allDone, addFiles, startUpload, reset }
}
