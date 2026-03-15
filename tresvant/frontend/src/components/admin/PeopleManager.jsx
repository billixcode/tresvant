import { useState } from 'react'
import { UserPlus, Merge, Edit, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function InlineText({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(value ?? ''); setEditing(true) }}
        className="cursor-pointer hover:text-white"
      >
        {value || <span className="italic text-neutral-500">click to edit</span>}
      </span>
    )
  }

  return (
    <input
      type="text"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
      autoFocus
      className="rounded bg-neutral-900 px-2 py-0.5 text-sm text-neutral-100 outline-none ring-1 ring-indigo-500"
    />
  )
}

export default function PeopleManager({ people, tracks, photos, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null)
  const [mergeSelection, setMergeSelection] = useState([])
  const [confirmMerge, setConfirmMerge] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function updatePerson(id, updates) {
    const { error } = await supabase.from('people').update(updates).eq('id', id)
    if (!error) onRefresh()
  }

  async function deletePerson(id) {
    if (!confirm('Delete this person? All track and photo associations will be removed.')) return
    await supabase.from('track_personnel').delete().eq('person_id', id)
    await supabase.from('photo_people').delete().eq('person_id', id)
    await supabase.from('people').delete().eq('id', id)
    onRefresh()
  }

  async function addPerson() {
    if (!newName.trim()) return
    const { error } = await supabase.from('people').insert({ name: newName.trim() })
    if (!error) { setNewName(''); setAdding(false); onRefresh() }
  }

  function toggleMergeSelect(id) {
    setMergeSelection(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
    setConfirmMerge(false)
  }

  async function executeMerge() {
    if (mergeSelection.length !== 2) return
    const [keepId, removeId] = mergeSelection

    // Reassign track_personnel
    await supabase
      .from('track_personnel')
      .update({ person_id: keepId })
      .eq('person_id', removeId)

    // Reassign photo_people
    await supabase
      .from('photo_people')
      .update({ person_id: keepId })
      .eq('person_id', removeId)

    // Delete the duplicate
    await supabase.from('people').delete().eq('id', removeId)

    setMergeSelection([])
    setConfirmMerge(false)
    onRefresh()
  }

  // Count tracks and photos per person
  function getTrackCount(personId) {
    return (tracks || []).filter(t =>
      (t.track_personnel || []).some(tp => tp.person_id === personId)
    ).length
  }

  function getPhotoCount(personId) {
    return (photos || []).filter(p =>
      (p.photo_people || []).some(pp => pp.person_id === personId)
    ).length
  }

  function getPersonTracks(personId) {
    return (tracks || []).filter(t =>
      (t.track_personnel || []).some(tp => tp.person_id === personId)
    )
  }

  function getPersonPhotos(personId) {
    return (photos || []).filter(p =>
      (p.photo_people || []).some(pp => pp.person_id === personId)
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">People Registry</h2>
        <div className="flex items-center gap-2">
          {mergeSelection.length === 2 && (
            <button
              onClick={() => confirmMerge ? executeMerge() : setConfirmMerge(true)}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium ${
                confirmMerge
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-amber-700 text-white hover:bg-amber-600'
              }`}
            >
              <Merge className="h-3 w-3" />
              {confirmMerge ? 'Confirm Merge' : 'Merge Selected'}
            </button>
          )}
          {confirmMerge && (
            <button onClick={() => setConfirmMerge(false)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
          )}
          {mergeSelection.length > 0 && !confirmMerge && (
            <button onClick={() => setMergeSelection([])} className="text-xs text-neutral-400 hover:text-neutral-200">Clear Selection</button>
          )}
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            <UserPlus className="h-3 w-3" /> Add Person
          </button>
        </div>
      </div>

      {/* Add person form */}
      {adding && (
        <div className="flex items-center gap-2 rounded bg-neutral-800 px-4 py-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Person name"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && addPerson()}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 outline-none ring-1 ring-neutral-700"
          />
          <button onClick={addPerson} className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500">Save</button>
          <button onClick={() => setAdding(false)} className="text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
        </div>
      )}

      {/* Merge instruction */}
      {mergeSelection.length > 0 && mergeSelection.length < 2 && (
        <p className="text-xs text-amber-400">Select one more person to merge with.</p>
      )}

      {/* People list */}
      <div className="space-y-1">
        {people.map(person => {
          const trackCount = getTrackCount(person.id)
          const photoCount = getPhotoCount(person.id)
          const expanded = expandedId === person.id
          const mergeSelected = mergeSelection.includes(person.id)

          return (
            <div key={person.id} className="rounded-lg border border-neutral-700 bg-neutral-800">
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Merge checkbox */}
                <input
                  type="checkbox"
                  checked={mergeSelected}
                  onChange={() => toggleMergeSelect(person.id)}
                  className="accent-amber-500"
                  title="Select for merge"
                />

                {/* Name (inline editable) */}
                <div className="flex-1 text-sm text-neutral-200">
                  <InlineText value={person.name} onSave={v => updatePerson(person.id, { name: v })} />
                </div>

                {/* Bio (inline editable) */}
                <div className="hidden sm:block flex-1 text-xs text-neutral-400">
                  <InlineText value={person.bio} onSave={v => updatePerson(person.id, { bio: v })} />
                </div>

                {/* Counts */}
                <span className="text-xs text-neutral-500">{trackCount} tracks</span>
                <span className="text-xs text-neutral-500">{photoCount} photos</span>

                {/* Actions */}
                <button
                  onClick={() => setExpandedId(expanded ? null : person.id)}
                  className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deletePerson(person.id)}
                  className="rounded p-1 text-red-500 hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded section */}
              {expanded && (
                <div className="border-t border-neutral-700 px-4 py-3 space-y-3">
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase text-neutral-400">Tracks</h4>
                    {getPersonTracks(person.id).length === 0 ? (
                      <p className="text-xs text-neutral-500">No tracks</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {getPersonTracks(person.id).map(t => (
                          <li key={t.id} className="text-xs text-neutral-300">{t.title} {t.album ? `(${t.album})` : ''}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase text-neutral-400">Photos</h4>
                    {getPersonPhotos(person.id).length === 0 ? (
                      <p className="text-xs text-neutral-500">No photos</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {getPersonPhotos(person.id).map(p => (
                          <li key={p.id} className="text-xs text-neutral-300">{p.caption || p.event || 'Untitled photo'}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {people.length === 0 && (
        <p className="py-12 text-center text-neutral-500">No people registered yet.</p>
      )}
    </div>
  )
}
