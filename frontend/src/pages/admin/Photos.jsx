import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import PhotoDropZone from '../../components/admin/PhotoDropZone'
import PhotoReviewGrid from '../../components/admin/PhotoReviewGrid'
import PhotoLibraryGrid from '../../components/admin/PhotoLibraryGrid'

export default function Photos() {
  const [tab, setTab] = useState('upload')
  const [people, setPeople] = useState([])
  const [photos, setPhotos] = useState([])
  const [pendingPhotos, setPendingPhotos] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [peopleRes, photosRes] = await Promise.all([
      supabase.from('people').select('*').order('name'),
      supabase.from('photos').select('*, photo_people(person_id)').order('created_at', { ascending: false }),
    ])
    if (peopleRes.data) setPeople(peopleRes.data)
    if (photosRes.data) {
      setPhotos(photosRes.data.map(p => ({
        ...p,
        people_ids: (p.photo_people || []).map(pp => pp.person_id),
      })))
    }
  }

  function handlePhotosReady(processed) {
    setPendingPhotos(prev => [...prev, ...processed])
  }

  async function handleUpload(items) {
    setUploading(true)
    for (const item of items) {
      try {
        const ext = item.file.name.split('.').pop().toLowerCase()
        const uuid = crypto.randomUUID()
        const storagePath = `band/${uuid}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(storagePath, item.file)
        if (uploadError) throw uploadError

        const { data: photo, error: insertError } = await supabase
          .from('photos')
          .insert({
            storage_path: storagePath,
            caption: item.caption || null,
            date: item.date || null,
            location: item.location || null,
            event: item.event || null,
            featured: item.featured || false,
          })
          .select()
          .single()
        if (insertError) throw insertError

        // Tag people
        if (item.peopleTags?.length) {
          const rows = item.peopleTags.map(personId => ({
            photo_id: photo.id,
            person_id: personId,
          }))
          await supabase.from('photo_people').insert(rows)
        }
      } catch (err) {
        console.error('Photo upload failed:', item.file.name, err)
      }
    }
    setPendingPhotos([])
    setUploading(false)
    loadData()
    setTab('library')
  }

  async function handleUpdate(photoId, updates) {
    // Handle people_ids separately
    if (updates.people_ids) {
      await supabase.from('photo_people').delete().eq('photo_id', photoId)
      if (updates.people_ids.length) {
        await supabase.from('photo_people').insert(
          updates.people_ids.map(personId => ({ photo_id: photoId, person_id: personId }))
        )
      }
      const { people_ids, ...rest } = updates
      if (Object.keys(rest).length) {
        await supabase.from('photos').update(rest).eq('id', photoId)
      }
    } else {
      await supabase.from('photos').update(updates).eq('id', photoId)
    }
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...updates } : p))
  }

  async function handleDelete(photoId) {
    await supabase.from('photos').delete().eq('id', photoId)
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      tab === t
        ? 'bg-neutral-800 text-neutral-100 border border-b-0 border-neutral-700'
        : 'text-neutral-400 hover:text-neutral-200'
    }`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-100">Photos</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-700">
        <button onClick={() => setTab('upload')} className={tabClass('upload')}>Upload</button>
        <button onClick={() => setTab('library')} className={tabClass('library')}>Library</button>
      </div>

      {/* Upload section */}
      {tab === 'upload' && (
        <div className="space-y-6">
          <PhotoDropZone onPhotosReady={handlePhotosReady} />

          {pendingPhotos.length > 0 && (
            <PhotoReviewGrid
              photos={pendingPhotos}
              people={people}
              onUpload={handleUpload}
            />
          )}

          {uploading && (
            <p className="text-sm text-indigo-400 animate-pulse">Uploading photos...</p>
          )}
        </div>
      )}

      {/* Library section */}
      {tab === 'library' && (
        <PhotoLibraryGrid
          photos={photos}
          people={people}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
