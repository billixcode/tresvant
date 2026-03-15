import { useState } from 'react'
import { Check, Tag } from 'lucide-react'

function PeoplePicker({ people, selected, onChange }) {
  const [open, setOpen] = useState(false)

  function toggle(personId) {
    const next = selected.includes(personId)
      ? selected.filter(id => id !== personId)
      : [...selected, personId]
    onChange(next)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-600"
      >
        <Tag className="h-3 w-3" />
        {selected.length || 'Tag people'}
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 max-h-40 w-48 overflow-y-auto rounded border border-neutral-700 bg-neutral-800 p-1 shadow-lg">
          {people.map(p => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="accent-indigo-500"
              />
              {p.name}
            </label>
          ))}
          <button onClick={() => setOpen(false)} className="mt-1 w-full text-center text-xs text-neutral-400 hover:text-neutral-200">Done</button>
        </div>
      )}
    </div>
  )
}

function guessEventName(filename) {
  const name = filename.toLowerCase()
  if (name.match(/live|concert|show|gig|stage|perform/)) return 'Live Performance'
  if (name.match(/rehearsal|practice|jam/)) return 'Rehearsal'
  if (name.match(/studio|record|session|track/)) return 'Studio Session'
  if (name.match(/promo|press|headshot|portrait/)) return 'Promo Shoot'
  if (name.match(/behind|bts|backstage/)) return 'Behind the Scenes'
  if (name.match(/tour/)) return 'Tour'
  if (name.match(/video|mv|music.?video/)) return 'Music Video Shoot'
  if (name.match(/album|cover|art/)) return 'Album Artwork'
  if (name.match(/interview|press/)) return 'Press / Interview'
  return 'Band Photos'
}

export default function PhotoReviewGrid({ photos, people, onUpload }) {
  const today = new Date().toISOString().split('T')[0]
  const [items, setItems] = useState(
    photos.map(p => ({
      ...p,
      caption: '',
      date: p.exifDate || today,
      location: p.location || '',
      event: guessEventName(p.file.name),
      peopleTags: [],
      featured: true,
    }))
  )
  const [selected, setSelected] = useState(new Set())
  const [batchField, setBatchField] = useState(null)
  const [batchValue, setBatchValue] = useState('')
  const [applyAllEvent, setApplyAllEvent] = useState(items[0]?.event || '')

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function toggleSelect(idx) {
    const next = new Set(selected)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    setSelected(next)
  }

  function applyBatch() {
    if (!batchValue || !batchField) { setBatchField(null); return }
    setItems(prev => prev.map((item, i) => selected.has(i) ? { ...item, [batchField]: batchValue } : item))
    setBatchField(null)
    setBatchValue('')
  }

  function applyEventToAll() {
    setItems(prev => prev.map(item => ({ ...item, event: applyAllEvent })))
  }

  return (
    <div className="space-y-4">
      {/* Apply event to all */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-neutral-400">Event Name (apply to all)</label>
          <input
            type="text"
            value={applyAllEvent}
            onChange={e => setApplyAllEvent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyEventToAll()}
            placeholder="e.g. Summer Tour 2024"
            className="w-full rounded bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 outline-none ring-1 ring-neutral-600 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={applyEventToAll}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Apply to All
        </button>
      </div>

      {/* Batch apply bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-indigo-950/40 border border-indigo-800 px-4 py-2">
          <span className="text-xs text-indigo-300 mr-2">{selected.size} selected</span>
          <button onClick={() => setBatchField('date')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Set Date</button>
          <button onClick={() => setBatchField('location')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Set Location</button>
          <button onClick={() => setBatchField('event')} className="rounded bg-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-600">Set Event</button>
        </div>
      )}

      {batchField && (
        <div className="flex items-center gap-2 rounded bg-neutral-800 px-4 py-2">
          <span className="text-xs text-neutral-400">Set {batchField}:</span>
          <input
            type={batchField === 'date' ? 'date' : 'text'}
            value={batchValue}
            onChange={e => setBatchValue(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && applyBatch()}
            className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none ring-1 ring-neutral-600"
          />
          <button onClick={applyBatch} className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500">Apply</button>
          <button onClick={() => setBatchField(null)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-lg border bg-neutral-800 p-3 space-y-2 ${
              selected.has(idx) ? 'border-indigo-500' : 'border-neutral-700'
            }`}
          >
            <div className="relative">
              <img
                src={item.preview}
                alt=""
                className="h-40 w-full rounded object-cover object-top"
              />
              <input
                type="checkbox"
                checked={selected.has(idx)}
                onChange={() => toggleSelect(idx)}
                className="absolute top-2 left-2 accent-indigo-500"
              />
              <button
                onClick={() => updateItem(idx, 'featured', !item.featured)}
                className={`absolute top-2 right-2 rounded px-2 py-0.5 text-xs font-medium ${
                  item.featured ? 'bg-amber-600 text-white' : 'bg-neutral-900/70 text-neutral-300'
                }`}
              >
                {item.featured ? 'Featured' : 'Feature'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 truncate" title={item.file.name}>{item.file.name}</p>
            <input
              type="text"
              placeholder="Caption"
              value={item.caption}
              onChange={e => updateItem(idx, 'caption', e.target.value)}
              className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
            />
            <input
              type="date"
              value={item.date}
              onChange={e => updateItem(idx, 'date', e.target.value)}
              className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none"
            />
            <input
              type="text"
              placeholder="Location"
              value={item.location}
              onChange={e => updateItem(idx, 'location', e.target.value)}
              className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
            />
            <input
              type="text"
              placeholder="Event name"
              value={item.event}
              onChange={e => updateItem(idx, 'event', e.target.value)}
              className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
            />
            <PeoplePicker
              people={people}
              selected={item.peopleTags}
              onChange={v => updateItem(idx, 'peopleTags', v)}
            />
          </div>
        ))}
      </div>

      {/* Upload All */}
      <div className="flex justify-end">
        <button
          onClick={() => onUpload(items)}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
        >
          <Check className="h-4 w-4" /> Upload All
        </button>
      </div>
    </div>
  )
}
