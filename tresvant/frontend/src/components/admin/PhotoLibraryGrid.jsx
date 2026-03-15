import { useState } from 'react'
import { Trash2, Star, Edit, Sparkles, Loader, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react'
import { getPublicUrl } from '../../lib/supabase'

function PeopleTagEditor({ people, current, onChange }) {
  const [open, setOpen] = useState(false)

  function toggle(personId) {
    const next = current.includes(personId)
      ? current.filter(id => id !== personId)
      : [...current, personId]
    onChange(next)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-indigo-400 hover:text-indigo-300"
      >
        {current.length} tagged
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 max-h-40 w-48 overflow-y-auto rounded border border-neutral-700 bg-neutral-800 p-1 shadow-lg">
          {people.map(p => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700">
              <input
                type="checkbox"
                checked={current.includes(p.id)}
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

export default function PhotoLibraryGrid({ photos, people, onUpdate, onDelete, onSuggestCaption, onSuggestAllCaptions, captionLoadingIds }) {
  const [filters, setFilters] = useState({ event: '', dateFrom: '', dateTo: '', personId: '', featured: '' })
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function updateFilter(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const filtered = photos.filter(photo => {
    if (filters.event && !(photo.event_name || '').toLowerCase().includes(filters.event.toLowerCase())) return false
    if (filters.dateFrom && photo.photo_date < filters.dateFrom) return false
    if (filters.dateTo && photo.photo_date > filters.dateTo) return false
    if (filters.personId && !(photo.people_ids || []).includes(filters.personId)) return false
    if (filters.featured === 'true' && !photo.featured) return false
    if (filters.featured === 'false' && photo.featured) return false
    return true
  })

  function startEdit(photo) {
    setEditingId(photo.id)
    setEditDraft({ caption: photo.caption || '', event_name: photo.event_name || '', location: photo.location || '', photo_date: photo.photo_date || '' })
  }

  function saveEdit(photoId) {
    onUpdate(photoId, editDraft)
    setEditingId(null)
  }

  function handleDelete(photoId) {
    if (confirmDeleteId === photoId) {
      onDelete(photoId)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(photoId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Event</label>
          <input
            type="text"
            value={filters.event}
            onChange={e => updateFilter('event', e.target.value)}
            placeholder="Filter by event..."
            className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Date From</label>
          <input type="date" value={filters.dateFrom} onChange={e => updateFilter('dateFrom', e.target.value)} className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Date To</label>
          <input type="date" value={filters.dateTo} onChange={e => updateFilter('dateTo', e.target.value)} className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Person</label>
          <select value={filters.personId} onChange={e => updateFilter('personId', e.target.value)} className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none">
            <option value="">All</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Featured</label>
          <select value={filters.featured} onChange={e => updateFilter('featured', e.target.value)} className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none">
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
        </div>
      </div>

      {/* Bulk caption bar */}
      {photos.length > 0 && (() => {
        const isGenerating = captionLoadingIds.size > 0
        const uncaptionedCount = photos.filter(p => !p.caption).length
        return (
          <div className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2">
            <span className="text-sm text-neutral-300">
              {isGenerating
                ? `Generating captions... ${captionLoadingIds.size} in progress`
                : uncaptionedCount > 0
                  ? `${photos.length} photos \u00b7 ${uncaptionedCount} without captions`
                  : `${photos.length} photos \u00b7 all captioned`}
            </span>
            <button
              onClick={onSuggestAllCaptions}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {uncaptionedCount === 0 || uncaptionedCount < photos.length ? 'Regenerate All Captions' : 'Suggest All Captions'}
            </button>
          </div>
        )
      })()}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(photo => (
          <div key={photo.id} className="rounded-lg border border-neutral-700 bg-neutral-800 p-3 space-y-2">
            <div className="relative">
              <img
                src={getPublicUrl('photos', photo.storage_path)}
                alt={photo.caption || ''}
                className={`h-40 w-full rounded object-cover ${photo.crop_position === 'center' ? 'object-center' : 'object-top'}`}
              />
              <button
                onClick={() => onUpdate(photo.id, { crop_position: photo.crop_position === 'center' ? 'top' : 'center' })}
                className="absolute top-2 left-2 rounded bg-black/50 p-1 text-white/70 hover:text-white transition-colors"
                title={photo.crop_position === 'center' ? 'Crop from top' : 'Center crop'}
              >
                {photo.crop_position === 'center'
                  ? <ArrowUpFromLine className="h-3.5 w-3.5" />
                  : <ArrowDownToLine className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => onUpdate(photo.id, { featured: !photo.featured })}
                className={`absolute top-2 right-2 rounded p-1 ${
                  photo.featured ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Star className={`h-4 w-4 ${photo.featured ? 'fill-current' : ''}`} />
              </button>
            </div>

            {editingId === photo.id ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={editDraft.caption}
                  onChange={e => setEditDraft(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Caption"
                  className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none"
                />
                <input
                  type="text"
                  value={editDraft.event_name}
                  onChange={e => setEditDraft(prev => ({ ...prev, event_name: e.target.value }))}
                  placeholder="Event"
                  className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none"
                />
                <input
                  type="text"
                  value={editDraft.location}
                  onChange={e => setEditDraft(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none"
                />
                <input
                  type="date"
                  value={editDraft.photo_date}
                  onChange={e => setEditDraft(prev => ({ ...prev, photo_date: e.target.value }))}
                  className="w-full rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none"
                />
                <button onClick={() => saveEdit(photo.id)} className="w-full rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500">Save</button>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-sm text-neutral-200 truncate">{photo.caption || 'No caption'}</p>
                <p className="text-xs text-neutral-400">{photo.event_name || 'No event'} &middot; {photo.photo_date || 'No date'}</p>
                <p className="text-xs text-neutral-500 truncate">{photo.location || ''}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <PeopleTagEditor
                people={people}
                current={photo.people_ids || []}
                onChange={ids => onUpdate(photo.id, { people_ids: ids })}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSuggestCaption(photo.id)}
                  disabled={captionLoadingIds.has(photo.id)}
                  className="rounded p-1 text-purple-400 hover:bg-neutral-700 hover:text-purple-300 disabled:opacity-50"
                  title="Suggest caption with AI"
                >
                  {captionLoadingIds.has(photo.id)
                    ? <Loader className="h-3.5 w-3.5 animate-spin" />
                    : <Sparkles className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => startEdit(photo)} className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className={`rounded p-1 ${confirmDeleteId === photo.id ? 'text-red-400 bg-red-900/30' : 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-neutral-500">No photos match the current filters.</p>
      )}
    </div>
  )
}
