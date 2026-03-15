import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Trash2, Check, Edit, Sparkles, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { suggestTrackMetadata } from '../../lib/openai'

function InlineCell({ value, onChange, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  function commit() {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  if (!editing) {
    return (
      <span
        onClick={e => { e.stopPropagation(); setDraft(value ?? ''); setEditing(true) }}
        className="cursor-pointer text-sm text-neutral-200 hover:text-white"
      >
        {value || <span className="text-neutral-500 italic">--</span>}
      </span>
    )
  }

  return (
    <input
      type={type}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
      onClick={e => e.stopPropagation()}
      autoFocus
      className="w-full rounded bg-neutral-900 px-1.5 py-0.5 text-sm text-neutral-100 outline-none ring-1 ring-indigo-500"
    />
  )
}

function formatDuration(sec) {
  if (!sec) return '--'
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`
}

export default function TrackList() {
  const navigate = useNavigate()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [sortCol, setSortCol] = useState('title')
  const [sortAsc, setSortAsc] = useState(true)

  // Batch action state
  const [batchAction, setBatchAction] = useState(null)
  const [batchValue, setBatchValue] = useState('')

  useEffect(() => {
    fetchTracks()
  }, [])

  async function fetchTracks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setTracks(data)
    setLoading(false)
  }

  const sorted = useMemo(() => {
    const copy = [...tracks]
    copy.sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortAsc ? cmp : -cmp
    })
    return copy
  }, [tracks, sortCol, sortAsc])

  function handleSort(col) {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(true) }
  }

  const allSelected = selected.size === tracks.length && tracks.length > 0

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tracks.map(t => t.id)))
  }

  function toggle(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  async function updateTrack(id, updates) {
    const { error } = await supabase.from('tracks').update(updates).eq('id', id)
    if (!error) setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  async function bulkPublish() {
    for (const id of selected) await updateTrack(id, { status: 'published' })
    setSelected(new Set())
  }

  async function bulkUnpublish() {
    for (const id of selected) await updateTrack(id, { status: 'draft' })
    setSelected(new Set())
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} track(s)?`)) return
    for (const id of selected) {
      const track = tracks.find(t => t.id === id)
      if (track?.storage_path) {
        await supabase.storage.from('audio').remove([track.storage_path])
      }
      await supabase.from('tracks').delete().eq('id', id)
    }
    setTracks(prev => prev.filter(t => !selected.has(t.id)))
    setSelected(new Set())
  }

  function commitBatch() {
    if (!batchValue) { setBatchAction(null); return }
    const field = batchAction === 'genre' ? 'genre' : 'album'
    selected.forEach(id => updateTrack(id, { [field]: batchValue }))
    setBatchAction(null)
    setBatchValue('')
  }

  const [aiLoadingIds, setAiLoadingIds] = useState(new Set())

  async function handleAiSuggest(trackId) {
    let track = tracks.find(t => t.id === trackId)
    if (!track) return
    setAiLoadingIds(prev => new Set(prev).add(trackId))
    try {
      // Step 1: Re-run edge function to pull latest tags (track_number, dates, etc.)
      if (track.storage_path) {
        try {
          await supabase.functions.invoke('extract-metadata', {
            body: { storage_path: track.storage_path, track_id: track.id }
          })
          // Refresh track from DB to get updated fields
          const { data: refreshed } = await supabase
            .from('tracks').select('*').eq('id', trackId).single()
          if (refreshed) {
            setTracks(prev => prev.map(t => t.id === trackId ? refreshed : t))
            track = refreshed
          }
        } catch (e) {
          console.warn('Re-extraction failed, continuing with AI:', e)
        }
      }

      // Step 2: AI suggest with all available data
      const suggestions = await suggestTrackMetadata({
        filename: track.original_filename || track.title,
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
      if (Object.keys(updates).length > 0) await updateTrack(trackId, updates)
    } catch (err) {
      console.error('AI metadata suggestion failed:', err)
    } finally {
      setAiLoadingIds(prev => { const next = new Set(prev); next.delete(trackId); return next })
    }
  }

  async function handleAiSuggestAll() {
    const targets = selected.size > 0 ? tracks.filter(t => selected.has(t.id)) : tracks
    for (const track of targets) {
      await handleAiSuggest(track.id)
    }
  }

  const SortHeader = ({ col, children }) => (
    <th
      onClick={() => handleSort(col)}
      className="cursor-pointer select-none px-3 py-2 hover:text-neutral-200"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </th>
  )

  if (loading) {
    return <p className="p-8 text-neutral-400">Loading tracks...</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-100">All Tracks</h1>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-indigo-950/40 border border-indigo-800 px-4 py-2">
          <span className="text-xs text-indigo-300 mr-2">{selected.size} selected</span>
          <button onClick={bulkPublish} className="rounded bg-green-700 px-3 py-1 text-xs text-white hover:bg-green-600">
            <Check className="mr-1 inline h-3 w-3" />Publish
          </button>
          <button onClick={bulkUnpublish} className="rounded bg-amber-700 px-3 py-1 text-xs text-white hover:bg-amber-600">Unpublish</button>
          <button onClick={bulkDelete} className="rounded bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-600">
            <Trash2 className="mr-1 inline h-3 w-3" />Delete
          </button>
          <button onClick={() => setBatchAction('genre')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Apply Genre</button>
          <button onClick={() => setBatchAction('album')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Apply Album</button>
        </div>
      )}

      {batchAction && (
        <div className="flex items-center gap-2 rounded bg-neutral-800 px-4 py-2">
          <span className="text-xs text-neutral-400">Set {batchAction} to:</span>
          <input
            value={batchValue}
            onChange={e => setBatchValue(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && commitBatch()}
            className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none ring-1 ring-neutral-600"
          />
          <button onClick={commitBatch} className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500">Apply</button>
          <button onClick={() => setBatchAction(null)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
        </div>
      )}

      {/* AI Suggest bar */}
      {tracks.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2">
          <span className="text-sm text-neutral-300">
            {aiLoadingIds.size > 0
              ? `AI analyzing tracks... ${aiLoadingIds.size} in progress`
              : selected.size > 0
                ? `AI suggest metadata for ${selected.size} selected track${selected.size !== 1 ? 's' : ''}`
                : `AI suggest metadata for all ${tracks.length} tracks`}
          </span>
          <button
            onClick={handleAiSuggestAll}
            disabled={aiLoadingIds.size > 0}
            className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoadingIds.size > 0 ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Suggest {selected.size > 0 ? 'Selected' : 'All'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-700">
        <table className="w-full text-left">
          <thead className="bg-neutral-800 text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-3 py-2 w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-indigo-500" />
              </th>
              <SortHeader col="track_number">#</SortHeader>
              <SortHeader col="title">Title</SortHeader>
              <SortHeader col="album">Album</SortHeader>
              <SortHeader col="status">Status</SortHeader>
              <SortHeader col="recorded_date">Recorded</SortHeader>
              <SortHeader col="duration_secs">Duration</SortHeader>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {sorted.map(track => (
              <tr
                key={track.id}
                onClick={() => navigate(`/admin/tracks/${track.id}`)}
                className="cursor-pointer hover:bg-neutral-800/50"
              >
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(track.id)}
                    onChange={() => toggle(track.id)}
                    className="accent-indigo-500"
                  />
                </td>
                <td className="px-3 py-2 text-sm text-neutral-400 w-10 text-center">{track.track_number ?? '--'}</td>
                <td className="px-3 py-2">
                  <InlineCell value={track.title} onChange={v => updateTrack(track.id, { title: v })} />
                </td>
                <td className="px-3 py-2 text-sm text-neutral-300">{track.album || '--'}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    track.status === 'published'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-amber-900/50 text-amber-400'
                  }`}>
                    {track.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <InlineCell value={track.recorded_date} type="date" onChange={v => updateTrack(track.id, { recorded_date: v })} />
                </td>
                <td className="px-3 py-2 text-sm text-neutral-300">{formatDuration(track.duration_secs)}</td>
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAiSuggest(track.id)}
                      disabled={aiLoadingIds.has(track.id)}
                      title="AI suggest metadata"
                      className="rounded p-1 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 disabled:opacity-50"
                    >
                      {aiLoadingIds.has(track.id)
                        ? <Loader className="h-4 w-4 animate-spin" />
                        : <Sparkles className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/tracks/${track.id}`)}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tracks.length === 0 && (
        <p className="py-12 text-center text-neutral-500">No tracks yet.</p>
      )}
    </div>
  )
}
