import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { suggestTrackMetadata } from '../../lib/openai'
import { useUploadQueue } from '../../hooks/useUploadQueue'
import DropZone from '../../components/admin/DropZone'
import BulkReviewTable from '../../components/admin/BulkReviewTable'

const STATUS_LABELS = {
  queued: 'Queued',
  uploading: 'Uploading...',
  extracting: 'Extracting metadata...',
  ready: 'Ready',
  error: 'Error',
}

const STATUS_COLORS = {
  queued: 'text-neutral-400',
  uploading: 'text-indigo-400',
  extracting: 'text-amber-400',
  ready: 'text-green-400',
  error: 'text-red-400',
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function BulkUpload() {
  const { files, statuses, uploadedTracks, allDone, addFiles, startUpload, reset } = useUploadQueue()
  const [people, setPeople] = useState([])

  useEffect(() => {
    supabase.from('people').select('*').order('name').then(({ data }) => {
      if (data) setPeople(data)
    })
  }, [])

  const [aiLoadingIds, setAiLoadingIds] = useState(new Set())
  const [trackOverrides, setTrackOverrides] = useState({})

  // Merge hook data with local overrides so UI reflects updates
  const displayTracks = uploadedTracks.map(t => ({ ...t, ...trackOverrides[t.id] }))
  const latestTracks = useRef(displayTracks)
  latestTracks.current = displayTracks

  const hasFiles = files.length > 0
  const uploading = Object.values(statuses).some(s => s === 'uploading' || s === 'extracting')

  async function handleUpdate(trackId, updates) {
    const { error } = await supabase.from('tracks').update(updates).eq('id', trackId)
    if (error) { console.error('Update failed:', error); return }
    setTrackOverrides(prev => ({ ...prev, [trackId]: { ...prev[trackId], ...updates } }))
  }

  async function handlePublish(trackId) {
    await supabase.from('tracks').update({ status: 'published' }).eq('id', trackId)
  }

  async function handleDelete(trackId) {
    const track = displayTracks.find(t => t.id === trackId)
    if (track?.storage_path) {
      await supabase.storage.from('audio').remove([track.storage_path])
    }
    await supabase.from('tracks').delete().eq('id', trackId)
  }

  async function handleAiSuggest(trackId) {
    const track = latestTracks.current.find(t => t.id === trackId)
    if (!track) return
    setAiLoadingIds(prev => new Set(prev).add(trackId))
    try {
      const suggestions = await suggestTrackMetadata({
        filename: track.original_filename || track.storage_path?.split('/').pop(),
        title: track.title,
        track_number: track.track_number,
        album: track.album,
        genre: track.genre,
        key: track.key,
        tempo_bpm: track.tempo_bpm,
        duration_secs: track.duration_secs,
        recorded_date: track.recorded_date,
        file_size: track.file_size,
      })
      // Only apply fields that have actual values
      const updates = {}
      if (suggestions.title) updates.title = suggestions.title
      if (suggestions.track_number) updates.track_number = suggestions.track_number
      if (suggestions.album) updates.album = suggestions.album
      if (suggestions.genre) updates.genre = Array.isArray(suggestions.genre) ? suggestions.genre : [suggestions.genre]
      if (suggestions.recorded_date) updates.recorded_date = suggestions.recorded_date
      if (suggestions.released_date) updates.released_date = suggestions.released_date
      if (suggestions.key) updates.key = suggestions.key
      if (suggestions.tempo_bpm) updates.tempo_bpm = suggestions.tempo_bpm
      if (suggestions.notes) updates.notes = suggestions.notes

      if (Object.keys(updates).length > 0) {
        await handleUpdate(trackId, updates)
      }
    } catch (err) {
      console.error('AI metadata suggestion failed:', err)
    } finally {
      setAiLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(trackId)
        return next
      })
    }
  }

  async function handleAiSuggestAll() {
    for (const track of latestTracks.current) {
      await handleAiSuggest(track.id)
    }
  }

  // Stage 1: Drop zone + file list
  if (!uploading && !allDone) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-100">Bulk Upload</h1>
        <DropZone onFiles={addFiles} />

        {hasFiles && (
          <>
            <ul className="space-y-1 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm text-neutral-300">
                  <span className="truncate">{f.name}</span>
                  <span className="ml-4 shrink-0 text-xs text-neutral-500">{formatSize(f.size)}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={startUpload}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Upload All ({files.length} file{files.length !== 1 ? 's' : ''})
            </button>
          </>
        )}
      </div>
    )
  }

  // Stage 2: Progress
  if (!allDone) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-100">Uploading...</h1>
        <ul className="space-y-1 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
          {files.map((f, i) => {
            const s = statuses[f.name] || 'queued'
            return (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="truncate text-neutral-300">{f.name}</span>
                <span className={`ml-4 shrink-0 text-xs font-medium ${STATUS_COLORS[s]}`}>
                  {STATUS_LABELS[s]}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // Stage 3: Review table
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-100">Review Uploaded Tracks</h1>
        <button
          onClick={reset}
          className="rounded bg-neutral-700 px-4 py-1.5 text-sm text-neutral-200 hover:bg-neutral-600"
        >
          Upload More
        </button>
      </div>
      <BulkReviewTable
        tracks={displayTracks}
        people={people}
        onUpdate={handleUpdate}
        onPublish={handlePublish}
        onDelete={handleDelete}
        onAiSuggest={handleAiSuggest}
        onAiSuggestAll={handleAiSuggestAll}
        aiLoadingIds={aiLoadingIds}
      />
    </div>
  )
}
