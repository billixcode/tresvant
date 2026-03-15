import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import PeopleManager from '../../components/admin/PeopleManager'

export default function People() {
  const [people, setPeople] = useState([])
  const [tracks, setTracks] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [peopleRes, tracksRes, photosRes] = await Promise.all([
      supabase.from('people').select('*').order('name'),
      supabase.from('tracks').select('*, track_personnel(person_id)'),
      supabase.from('photos').select('*, photo_people(person_id)'),
    ])
    if (peopleRes.data) setPeople(peopleRes.data)
    if (tracksRes.data) setTracks(tracksRes.data)
    if (photosRes.data) setPhotos(photosRes.data)
    setLoading(false)
  }

  if (loading) return <p className="p-8 text-neutral-400">Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-100">People</h1>
      <PeopleManager
        people={people}
        tracks={tracks}
        photos={photos}
        onRefresh={loadData}
      />
    </div>
  )
}
