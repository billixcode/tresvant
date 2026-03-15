import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

const ACCEPTED = '.mp3,.flac,.wav,.m4a,.ogg'

export default function DropZone({ onFiles }) {
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)

  function handleDragOver(e) {
    e.preventDefault()
    setOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setOver(false)
    if (e.dataTransfer.files.length) {
      onFiles(e.dataTransfer.files)
    }
  }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e) {
    if (e.target.files.length) {
      onFiles(e.target.files)
      e.target.value = ''
    }
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
      <Upload className="h-10 w-10" />
      <p className="text-sm font-medium">Drag files here or click to browse</p>
      <p className="text-xs text-neutral-500">Accepts MP3, FLAC, WAV, M4A, OGG</p>
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
