import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import exifr from 'exifr'

const ACCEPTED = '.jpg,.jpeg,.png,.webp'

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'Tresvant-App' } }
    )
    const data = await res.json()
    return data.display_name || null
  } catch {
    return null
  }
}

async function processPhoto(file) {
  const preview = URL.createObjectURL(file)
  let exifDate = null
  let location = null

  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'latitude', 'longitude'] })
    if (exif) {
      if (exif.DateTimeOriginal) {
        const d = exif.DateTimeOriginal instanceof Date ? exif.DateTimeOriginal : new Date(exif.DateTimeOriginal)
        exifDate = d.toISOString().split('T')[0]
      }
      const lat = exif.latitude ?? exif.GPSLatitude
      const lon = exif.longitude ?? exif.GPSLongitude
      if (lat != null && lon != null) {
        location = await reverseGeocode(lat, lon)
      }
    }
  } catch (e) {
    console.warn('EXIF extraction failed for', file.name, e)
  }

  return { file, preview, exifDate, location }
}

export default function PhotoDropZone({ onPhotosReady }) {
  const [over, setOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef(null)

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    })
    if (!files.length) return

    setProcessing(true)
    // Process sequentially to respect Nominatim rate limits
    const results = []
    for (const file of files) {
      results.push(await processPhoto(file))
    }
    onPhotosReady(results)
    setProcessing(false)
  }

  function handleDragOver(e) { e.preventDefault(); setOver(true) }
  function handleDragLeave(e) { e.preventDefault(); setOver(false) }
  function handleDrop(e) {
    e.preventDefault()
    setOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function handleClick() { inputRef.current?.click() }
  function handleChange(e) {
    if (e.target.files.length) { handleFiles(e.target.files); e.target.value = '' }
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
        over
          ? 'border-indigo-400 bg-indigo-950/30 text-indigo-300'
          : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500'
      }`}
    >
      {processing ? (
        <>
          <Camera className="h-10 w-10 animate-pulse" />
          <p className="text-sm font-medium">Processing photos...</p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10" />
          <p className="text-sm font-medium">Drag photos here or click to browse</p>
          <p className="text-xs text-neutral-500">Accepts JPG, PNG, WebP</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
