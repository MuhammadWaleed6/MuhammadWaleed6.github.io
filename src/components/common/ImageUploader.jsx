import { useRef, useState } from 'react'
import { uploadMedia, deleteMediaByUrl } from '../../services/contentService'

/**
 * Image upload field:
 * - drag & drop or click to browse
 * - uploads to Supabase Storage (portfolio-media bucket)
 * - shows preview + progress
 * - optional "remove" to clear (and best-effort delete of the stored file)
 */
export default function ImageUploader({ value, onChange, folder = 'misc', label = 'Image' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

  async function handleFile(file) {
    setError('')
    if (!file) return
    if (!accepted.includes(file.type)) {
      setError('Please choose a JPG, PNG, WebP, AVIF or GIF image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.')
      return
    }
    setUploading(true)
    setProgress(15)
    // Fake-but-honest progress: storage upload is a single request.
    const ticker = setInterval(() => setProgress((p) => Math.min(p + 12, 90)), 220)
    try {
      const url = await uploadMedia(file, folder)
      if (value && value !== url) deleteMediaByUrl(value) // best-effort cleanup of old file
      setProgress(100)
      onChange(url)
    } catch (err) {
      setError(err.message || 'Upload failed. Check Storage policies and your connection.')
    } finally {
      clearInterval(ticker)
      setUploading(false)
      setTimeout(() => setProgress(0), 600)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  function removeImage() {
    if (value) deleteMediaByUrl(value)
    onChange('')
  }

  return (
    <div className="field">
      <label>{label}</label>

      {value ? (
        <div className="upload-preview">
          <img src={value} alt={`${label} preview`} />
          <div className="upload-preview-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()}>
              <i className="pi pi-refresh" aria-hidden="true" /> Replace
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={removeImage}>
              <i className="pi pi-trash" aria-hidden="true" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`upload-zone ${dragOver ? 'dragover' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <>
              <div className="spinner spinner-dark" aria-hidden="true" />
              Uploading… {progress}%
            </>
          ) : (
            <>
              <i className="pi pi-upload" aria-hidden="true" />
              Drop an image here, or click to browse
              <span className="upload-hint">JPG, PNG, WebP, AVIF or GIF · max 5 MB</span>
            </>
          )}
        </div>
      )}

      {uploading && value ? (
        <div className="upload-progress" aria-hidden="true">
          <div style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {error ? (
        <span className="error" role="alert">
          {error}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accepted.join(',')}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          handleFile(file)
        }}
      />
    </div>
  )
}
