import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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

  const hasFiles = files.length > 0
  const uploading = Object.values(statuses).some(s => s === 'uploading' || s === 'extracting')

  async function handleUpdate(trackId, updates) {
    const { error } = await supabase.from('tracks').update(updates).eq('id', trackId)
    if (error) console.error('Update failed:', error)
  }

  async function handlePublish(trackId) {
    await supabase.from('tracks').update({ status: 'published' }).eq('id', trackId)
  }

  async function handleDelete(trackId) {
    await supabase.from('tracks').delete().eq('id', trackId)
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
        tracks={uploadedTracks}
        people={people}
        onUpdate={handleUpdate}
        onPublish={handlePublish}
        onDelete={handleDelete}
      />
    </div>
  )
}
