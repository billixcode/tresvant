import { useState, useRef } from 'react'
import { Save, Trash2, Upload, Music } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ROLES = ['performer', 'producer', 'engineer', 'composer', 'featuring']

function TagInput({ value, onChange }) {
  const [input, setInput] = useState('')
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : []

  function addTag() {
    const tag = input.trim()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag].join(', '))
    }
    setInput('')
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag).join(', '))
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-1">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-indigo-900/50 px-2 py-0.5 text-xs text-indigo-300"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-white">&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
        onBlur={addTag}
        placeholder="Add genre tag..."
        className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
      />
    </div>
  )
}

export default function TrackEditorComponent({ track: initial, people = [], onSave, onDelete, onNavigateBack }) {
  const [track, setTrack] = useState({ ...initial })
  const [personnel, setPersonnel] = useState(initial.track_personnel || [])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)

  // Personnel add state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [newInstrument, setNewInstrument] = useState('')
  const [newRole, setNewRole] = useState('performer')
  const [newSessionNotes, setNewSessionNotes] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  function update(field, value) {
    setTrack(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { id, track_personnel, created_at, ...fields } = track
    const { error } = await supabase.from('tracks').update(fields).eq('id', id)
    if (error) console.error('Save failed:', error)
    else if (onSave) onSave(track)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    const { error } = await supabase.from('tracks').delete().eq('id', track.id)
    if (!error && onDelete) onDelete(track.id)
    setConfirmDelete(false)
  }

  async function replaceAudio(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const storagePath = `tracks/${track.id}.${ext}`
    const { error } = await supabase.storage.from('audio').upload(storagePath, file, { upsert: true })
    if (error) { console.error('Audio upload failed:', error); return }
    await supabase.from('tracks').update({ storage_path: storagePath }).eq('id', track.id)
    update('storage_path', storagePath)
  }

  async function replaceCover(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const storagePath = `tracks/${track.id}_cover.${ext}`
    const { error } = await supabase.storage.from('photos').upload(storagePath, file, { upsert: true })
    if (error) { console.error('Cover upload failed:', error); return }
    await supabase.from('tracks').update({ cover_path: storagePath }).eq('id', track.id)
    update('cover_path', storagePath)
  }

  async function addPersonnel() {
    if (!selectedPerson || !newInstrument) return
    const { data, error } = await supabase
      .from('track_personnel')
      .insert({
        track_id: track.id,
        person_id: selectedPerson.id,
        instrument: newInstrument,
        role: newRole,
        session_notes: newSessionNotes,
      })
      .select('*, person:people(*)')
      .single()
    if (error) { console.error('Add personnel failed:', error); return }
    setPersonnel(prev => [...prev, data])
    setSearchTerm('')
    setSelectedPerson(null)
    setNewInstrument('')
    setNewRole('performer')
    setNewSessionNotes('')
  }

  async function removePersonnel(rowId) {
    const { error } = await supabase.from('track_personnel').delete().eq('id', rowId)
    if (!error) setPersonnel(prev => prev.filter(r => r.id !== rowId))
  }

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !personnel.some(r => r.person_id === p.id)
  )

  const Field = ({ label, children }) => (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</label>
      {children}
    </div>
  )

  const inputClass = 'w-full rounded bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none ring-1 ring-neutral-700 focus:ring-indigo-500'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="h-6 w-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-neutral-100">{track.title || 'Untitled Track'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          {confirmDelete && (
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
          )}
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-400">Status:</span>
        <button
          onClick={() => update('status', track.status === 'published' ? 'draft' : 'published')}
          className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
            track.status === 'published'
              ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
              : 'bg-amber-900/50 text-amber-400 hover:bg-amber-900/70'
          }`}
        >
          {track.status === 'published' ? 'Published' : 'Draft'}
        </button>
      </div>

      {/* Fields grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title">
          <input type="text" value={track.title || ''} onChange={e => update('title', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Album">
          <input type="text" value={track.album || ''} onChange={e => update('album', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Recorded Date">
          <input type="date" value={track.recorded_date || ''} onChange={e => update('recorded_date', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Released Date">
          <input type="date" value={track.released_date || ''} onChange={e => update('released_date', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Genre">
          <TagInput value={track.genre || ''} onChange={v => update('genre', v)} />
        </Field>
        <Field label="Key">
          <input type="text" value={track.key || ''} onChange={e => update('key', e.target.value)} placeholder="e.g. C minor" className={inputClass} />
        </Field>
        <Field label="Tempo (BPM)">
          <input type="number" value={track.tempo_bpm || ''} onChange={e => update('tempo_bpm', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={track.notes || ''}
          onChange={e => update('notes', e.target.value)}
          rows={4}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {/* Audio replace */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => audioInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded bg-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-600"
        >
          <Upload className="h-4 w-4" /> Replace Audio
        </button>
        <span className="text-xs text-neutral-500">{track.storage_path || 'No file'}</span>
        <input ref={audioInputRef} type="file" accept=".mp3,.flac,.wav,.m4a,.ogg" onChange={replaceAudio} className="hidden" />
      </div>

      {/* Cover art */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => coverInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded bg-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-600"
        >
          <Upload className="h-4 w-4" /> {track.cover_path ? 'Replace Cover Art' : 'Upload Cover Art'}
        </button>
        <input ref={coverInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={replaceCover} className="hidden" />
      </div>

      {/* Personnel */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-100">Personnel</h2>

        {personnel.length > 0 && (
          <div className="space-y-1">
            {personnel.map(row => (
              <div key={row.id} className="flex items-center justify-between rounded bg-neutral-800 px-3 py-2">
                <div className="text-sm text-neutral-200">
                  <span className="font-medium">{row.person?.name || row.person_id}</span>
                  <span className="mx-2 text-neutral-500">&mdash;</span>
                  <span>{row.instrument}</span>
                  <span className="ml-2 text-xs text-neutral-400">({row.role})</span>
                  {row.session_notes && (
                    <span className="ml-2 text-xs text-neutral-500 italic">{row.session_notes}</span>
                  )}
                </div>
                <button onClick={() => removePersonnel(row.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add personnel */}
        <div className="grid gap-3 rounded-lg border border-neutral-700 bg-neutral-850 p-4 sm:grid-cols-5">
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Search person..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setSelectedPerson(null); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              className={inputClass}
            />
            {showSuggestions && searchTerm && filteredPeople.length > 0 && (
              <ul className="absolute left-0 right-0 z-10 mt-1 max-h-40 overflow-y-auto rounded border border-neutral-700 bg-neutral-900 shadow-lg">
                {filteredPeople.map(p => (
                  <li
                    key={p.id}
                    onClick={() => { setSelectedPerson(p); setSearchTerm(p.name); setShowSuggestions(false) }}
                    className="cursor-pointer px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            placeholder="Instrument"
            value={newInstrument}
            onChange={e => setNewInstrument(e.target.value)}
            className={inputClass}
          />
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className={inputClass}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input
            type="text"
            placeholder="Session notes"
            value={newSessionNotes}
            onChange={e => setNewSessionNotes(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={addPersonnel}
            disabled={!selectedPerson || !newInstrument}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed sm:col-span-5"
          >
            Add Personnel
          </button>
        </div>
      </div>
    </div>
  )
}
