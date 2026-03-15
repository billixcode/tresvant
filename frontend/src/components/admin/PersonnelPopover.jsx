import { useState, useRef, useEffect } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ROLES = ['performer', 'producer', 'engineer', 'composer', 'featuring']

export default function PersonnelPopover({ trackId, personnel, people, onUpdate, onClose }) {
  const [rows, setRows] = useState(personnel || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [instrument, setInstrument] = useState('')
  const [role, setRole] = useState('performer')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !rows.some(r => r.person_id === p.id)
  )

  async function handleAdd() {
    if (!selectedPerson || !instrument) return

    const { data, error } = await supabase
      .from('track_personnel')
      .insert({
        track_id: trackId,
        person_id: selectedPerson.id,
        instrument,
        role,
      })
      .select('*, person:people(*)')
      .single()

    if (error) {
      console.error('Failed to add personnel:', error)
      return
    }

    const updated = [...rows, data]
    setRows(updated)
    onUpdate(updated)
    setSearchTerm('')
    setInstrument('')
    setRole('performer')
    setSelectedPerson(null)
  }

  async function handleRemove(row) {
    const { error } = await supabase
      .from('track_personnel')
      .delete()
      .eq('id', row.id)

    if (error) {
      console.error('Failed to remove personnel:', error)
      return
    }

    const updated = rows.filter(r => r.id !== row.id)
    setRows(updated)
    onUpdate(updated)
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-96 rounded-lg border border-neutral-700 bg-neutral-800 p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-100">Personnel</h4>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Current personnel */}
      <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
        {rows.map(row => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded bg-neutral-700/50 px-2 py-1 text-xs text-neutral-200"
          >
            <span>
              {row.person?.name || row.person_id} &mdash; {row.instrument} ({row.role})
            </span>
            <button onClick={() => handleRemove(row)} className="text-red-400 hover:text-red-300">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-neutral-500">No personnel assigned</p>
        )}
      </div>

      {/* Add row */}
      <div className="space-y-2 border-t border-neutral-700 pt-3">
        <div className="relative">
          <div className="flex items-center gap-1 rounded bg-neutral-900 px-2">
            <Search className="h-3 w-3 text-neutral-500" />
            <input
              type="text"
              placeholder="Search person..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setSelectedPerson(null)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-transparent py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
            />
          </div>
          {showSuggestions && searchTerm && filteredPeople.length > 0 && (
            <ul className="absolute left-0 right-0 z-10 mt-1 max-h-32 overflow-y-auto rounded bg-neutral-900 border border-neutral-700 shadow-lg">
              {filteredPeople.map(p => (
                <li
                  key={p.id}
                  onClick={() => {
                    setSelectedPerson(p)
                    setSearchTerm(p.name)
                    setShowSuggestions(false)
                  }}
                  className="cursor-pointer px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
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
          value={instrument}
          onChange={e => setInstrument(e.target.value)}
          className="w-full rounded bg-neutral-900 px-2 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
        />

        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full rounded bg-neutral-900 px-2 py-1.5 text-xs text-neutral-200 outline-none"
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <button
          onClick={handleAdd}
          disabled={!selectedPerson || !instrument}
          className="flex w-full items-center justify-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    </div>
  )
}
