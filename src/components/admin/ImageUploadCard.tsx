'use client'

import { useRef, useState } from 'react'
import { ImageType, ImageMetadata } from '@/types/card'
import { generateThumbnailUrl } from '@/lib/imageUtils'

interface ImageUploadCardProps {
  imageType: ImageType
  certificationNumber: number
  existing?: ImageMetadata | null
  uploading: boolean
  onUpload: (file: File) => void
  onDelete: () => void
}

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  'front': 'Front',
  'back': 'Back',
  'front_corner_topLeft': 'Front TL',
  'front_corner_topRight': 'Front TR',
  'front_corner_bottomLeft': 'Front BL',
  'front_corner_bottomRight': 'Front BR',
  'back_corner_topLeft': 'Back TL',
  'back_corner_topRight': 'Back TR',
  'back_corner_bottomLeft': 'Back BL',
  'back_corner_bottomRight': 'Back BR',
  'front_corners': 'Front Corners',
  'back_corners': 'Back Corners',
  'front_edges': 'Front Edges',
  'back_edges': 'Back Edges',
  'front_surface': 'Front Surface',
  'back_surface': 'Back Surface'
}

export function ImageUploadCard({ 
  imageType, 
  certificationNumber, 
  existing, 
  uploading, 
  onUpload, 
  onDelete 
}: ImageUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('El archivo no puede ser mayor a 100MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const existingImageUrl = existing 
    ? generateThumbnailUrl(existing.publicId)
    : null

  const displayImage = preview || existingImageUrl

  return (
    <div className="card h-100">
      <div className="card-header py-2">
        <small className="fw-bold text-muted">
          {IMAGE_TYPE_LABELS[imageType]}
        </small>
      </div>
      
      <div className="card-body p-2">
        <div 
          className={`upload-zone border-2 border-dashed rounded d-flex flex-column align-items-center justify-content-center ${
            dragOver ? 'border-primary bg-light' : 'border-secondary'
          } ${uploading ? 'uploading' : ''}`}
          style={{ minHeight: '120px', cursor: 'pointer' }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {uploading ? (
            <div className="text-center">
              <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                <span className="visually-hidden">Subiendo...</span>
              </div>
              <div className="small text-muted">Subiendo...</div>
            </div>
          ) : displayImage ? (
            <div className="text-center w-100">
              <img 
                src={displayImage} 
                alt={imageType}
                className="img-fluid rounded mb-2"
                style={{ maxHeight: '80px', objectFit: 'cover' }}
              />
              <div className="small text-muted">
                {preview ? 'Vista previa' : 'Click para cambiar'}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <svg width="32" height="32" className="text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div className="small text-muted">
                Click o arrastra imagen
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="d-none"
          />
        </div>

        {existing && (
          <div className="mt-2 d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {existing.width}×{existing.height} • {(existing.size / 1024).toFixed(0)}KB
            </small>
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              disabled={uploading}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}