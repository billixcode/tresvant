import { useState, useCallback } from 'react'
import { Check, Trash2, Edit, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import PersonnelPopover from './PersonnelPopover'

function InlineCell({ value, onChange, type = 'text', readOnly = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  function commit() {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  if (readOnly) {
    return <span className="text-sm text-neutral-300">{value ?? '\u2014'}</span>
  }

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(value ?? ''); setEditing(true) }}
        className="cursor-pointer text-sm text-neutral-200 hover:text-white"
      >
        {value || <span className="text-neutral-500 italic">click to edit</span>}
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
      autoFocus
      className="w-full rounded bg-neutral-900 px-1.5 py-0.5 text-sm text-neutral-100 outline-none ring-1 ring-indigo-500"
    />
  )
}

export default function BulkReviewTable({ tracks, onUpdate, onPublish, onDelete, people = [] }) {
  const [selected, setSelected] = useState(new Set())
  const [personnelOpen, setPersonnelOpen] = useState(null)
  const [batchField, setBatchField] = useState(null)
  const [batchValue, setBatchValue] = useState('')

  const allSelected = selected.size === tracks.length && tracks.length > 0

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tracks.map(t => t.id)))
  }

  function toggle(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  function handleFieldUpdate(trackId, field, value) {
    onUpdate(trackId, { [field]: value })
  }

  function applyBatch(field) {
    setBatchField(field)
    setBatchValue('')
  }

  function commitBatch() {
    if (!batchValue) { setBatchField(null); return }
    selected.forEach(id => onUpdate(id, { [batchField]: batchValue }))
    setBatchField(null)
    setBatchValue('')
  }

  function publishSelected() {
    selected.forEach(id => onPublish(id))
    setSelected(new Set())
  }

  function publishAll() {
    tracks.forEach(t => onPublish(t.id))
  }

  const handlePersonnelUpdate = useCallback((trackId, updatedPersonnel) => {
    onUpdate(trackId, { personnel: updatedPersonnel })
  }, [onUpdate])

  return (
    <div className="space-y-3">
      {/* Batch actions bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-indigo-950/40 border border-indigo-800 px-4 py-2">
          <span className="text-xs text-indigo-300 mr-2">{selected.size} selected</span>
          <button onClick={() => applyBatch('album')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Set Album</button>
          <button onClick={() => applyBatch('recorded_date')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Set Date</button>
          <button onClick={() => applyBatch('genre')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Set Genre</button>
          <button onClick={publishSelected} className="rounded bg-green-700 px-3 py-1 text-xs text-white hover:bg-green-600">
            <Check className="mr-1 inline h-3 w-3" />Publish Selected
          </button>
        </div>
      )}

      {/* Batch field input */}
      {batchField && (
        <div className="flex items-center gap-2 rounded bg-neutral-800 px-4 py-2">
          <span className="text-xs text-neutral-400">Set {batchField} to:</span>
          <input
            type={batchField === 'recorded_date' ? 'date' : 'text'}
            value={batchValue}
            onChange={e => setBatchValue(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && commitBatch()}
            className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none ring-1 ring-neutral-600"
          />
          <button onClick={commitBatch} className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500">Apply</button>
          <button onClick={() => setBatchField(null)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
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
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Album</th>
              <th className="px-3 py-2">Recorded</th>
              <th className="px-3 py-2">Genre</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Personnel</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {tracks.map(track => (
              <tr key={track.id} className="hover:bg-neutral-800/50">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(track.id)}
                    onChange={() => toggle(track.id)}
                    className="accent-indigo-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <InlineCell value={track.title} onChange={v => handleFieldUpdate(track.id, 'title', v)} />
                </td>
                <td className="px-3 py-2">
                  <InlineCell value={track.album} onChange={v => handleFieldUpdate(track.id, 'album', v)} />
                </td>
                <td className="px-3 py-2">
                  <InlineCell value={track.recorded_date} type="date" onChange={v => handleFieldUpdate(track.id, 'recorded_date', v)} />
                </td>
                <td className="px-3 py-2">
                  <InlineCell value={track.genre} onChange={v => handleFieldUpdate(track.id, 'genre', v)} />
                </td>
                <td className="px-3 py-2">
                  <InlineCell value={track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.round(track.duration % 60)).padStart(2, '0')}` : null} readOnly />
                </td>
                <td className="relative px-3 py-2">
                  <button
                    onClick={() => setPersonnelOpen(personnelOpen === track.id ? null : track.id)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    {track.personnel?.length || 0} people <ChevronDown className="h-3 w-3" />
                  </button>
                  {personnelOpen === track.id && (
                    <PersonnelPopover
                      trackId={track.id}
                      personnel={track.personnel || []}
                      people={people}
                      onUpdate={updated => handlePersonnelUpdate(track.id, updated)}
                      onClose={() => setPersonnelOpen(null)}
                    />
                  )}
                </td>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPublish(track.id)}
                      title="Publish"
                      className="rounded p-1 text-green-500 hover:bg-green-900/30"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(track.id)}
                      title="Delete"
                      className="rounded p-1 text-red-500 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/admin/tracks/${track.id}`}
                      title="Edit"
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Publish All */}
      <div className="flex justify-end">
        <button
          onClick={publishAll}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
        >
          <Check className="mr-1.5 inline h-4 w-4" />Publish All
        </button>
      </div>
    </div>
  )
}
