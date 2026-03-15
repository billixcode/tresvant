import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import TrackEditorComponent from '../../components/admin/TrackEditor'

export default function TrackEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [trackRes, peopleRes] = await Promise.all([
        supabase
          .from('tracks')
          .select('*, track_personnel(*, person:people(*))')
          .eq('id', id)
          .single(),
        supabase.from('people').select('*').order('name'),
      ])

      if (trackRes.data) setTrack(trackRes.data)
      if (peopleRes.data) setPeople(peopleRes.data)
      setLoading(false)
    }
    load()
  }, [id])

  function handleSave(updated) {
    setTrack(prev => ({ ...prev, ...updated }))
  }

  function handleDelete() {
    navigate('/admin/tracks')
  }

  if (loading) return <p className="p-8 text-neutral-400">Loading...</p>
  if (!track) return <p className="p-8 text-red-400">Track not found.</p>

  return (
    <TrackEditorComponent
      track={track}
      people={people}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  )
}
