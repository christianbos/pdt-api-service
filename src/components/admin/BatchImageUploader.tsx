'use client'

import { useState, useRef } from 'react'
import { ImageType } from '@/types/card'

interface PendingImage {
  id: string
  file: File
  imageType: ImageType
  preview: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

interface BatchImageUploaderProps {
  certificationNumber: number
  onUploadComplete: () => void
}

const IMAGE_TYPE_OPTIONS: { value: ImageType; label: string; category: string }[] = [
  { value: 'front', label: 'Card Front', category: 'Main' },
  { value: 'back', label: 'Card Back', category: 'Main' },
  { value: 'front_corner_topLeft', label: 'Front Corner TL', category: 'Corners' },
  { value: 'front_corner_topRight', label: 'Front Corner TR', category: 'Corners' },
  { value: 'front_corner_bottomLeft', label: 'Front Corner BL', category: 'Corners' },
  { value: 'front_corner_bottomRight', label: 'Front Corner BR', category: 'Corners' },
  { value: 'back_corner_topLeft', label: 'Back Corner TL', category: 'Corners' },
  { value: 'back_corner_topRight', label: 'Back Corner TR', category: 'Corners' },
  { value: 'back_corner_bottomLeft', label: 'Back Corner BL', category: 'Corners' },
  { value: 'back_corner_bottomRight', label: 'Back Corner BR', category: 'Corners' },
  { value: 'front_edges', label: 'Front Edges', category: 'Specialized' },
  { value: 'back_edges', label: 'Back Edges', category: 'Specialized' },
  { value: 'front_surface', label: 'Front Surface', category: 'Specialized' },
  { value: 'back_surface', label: 'Back Surface', category: 'Specialized' },
]

export function BatchImageUploader({ certificationNumber, onUploadComplete }: BatchImageUploaderProps) {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList) => {
    const newImages: PendingImage[] = []

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 100 * 1024 * 1024) return

      const id = `${Date.now()}-${index}`
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const preview = e.target?.result as string
        newImages.push({
          id,
          file,
          imageType: 'front', // Default
          preview,
          uploading: false,
          uploaded: false
        })

        if (newImages.length === Array.from(files).filter(f => 
          f.type.startsWith('image/') && f.size <= 100 * 1024 * 1024
        ).length) {
          setPendingImages(prev => [...prev, ...newImages])
        }
      }
      
      reader.readAsDataURL(file)
    })
  }

  const updateImageType = (id: string, imageType: ImageType) => {
    setPendingImages(prev => prev.map(img => 
      img.id === id ? { ...img, imageType } : img
    ))
  }

  const removeImage = (id: string) => {
    setPendingImages(prev => prev.filter(img => img.id !== id))
  }

  const uploadAll = async () => {
    setIsUploading(true)

    for (const image of pendingImages) {
      if (image.uploaded) continue

      setPendingImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploading: true, error: undefined } : img
      ))

      try {
        const formData = new FormData()
        formData.append('file', image.file)
        formData.append('imageType', image.imageType)

        const response = await fetch(`/api/admin/cards/${certificationNumber}/images`, {
          method: 'POST',
          body: formData,
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
          }
        })

        if (response.ok) {
          setPendingImages(prev => prev.map(img => 
            img.id === image.id ? { ...img, uploading: false, uploaded: true } : img
          ))
        } else {
          const error = await response.json()
          setPendingImages(prev => prev.map(img => 
            img.id === image.id ? { 
              ...img, 
              uploading: false, 
              error: error.error || 'Error al subir'
            } : img
          ))
        }
      } catch (error) {
        setPendingImages(prev => prev.map(img => 
          img.id === image.id ? { 
            ...img, 
            uploading: false, 
            error: 'Error de conexión'
          } : img
        ))
      }
    }

    setIsUploading(false)
    onUploadComplete()
  }

  const clearCompleted = () => {
    setPendingImages(prev => prev.filter(img => !img.uploaded))
  }

  const hasUnuploaded = pendingImages.some(img => !img.uploaded)
  const allUploaded = pendingImages.length > 0 && pendingImages.every(img => img.uploaded)

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <svg width="20" height="20" className="me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Subir Imágenes
        </h5>
      </div>
      <div className="card-body">
        {/* Zona de drop */}
        <div 
          className="border-2 border-dashed border-secondary rounded p-4 text-center mb-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addFiles(e.dataTransfer.files)
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="48" height="48" className="text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="mb-2">
            <strong>Arrastra archivos aquí o click para seleccionar</strong>
          </p>
          <small className="text-muted">
            Múltiples imágenes, hasta 100MB cada una
          </small>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="d-none"
          />
        </div>

        {/* Lista de imágenes pendientes */}
        {pendingImages.length > 0 && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Imágenes preparadas ({pendingImages.length})</h6>
              <div className="btn-group btn-group-sm">
                {allUploaded && (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={clearCompleted}
                  >
                    Limpiar completadas
                  </button>
                )}
                {hasUnuploaded && (
                  <button 
                    className="btn btn-primary"
                    onClick={uploadAll}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" className="me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Subir imagenes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="row g-3">
              {pendingImages.map((image) => (
                <div key={image.id} className="col-md-6 col-lg-4">
                  <div className={`card h-100 ${image.uploaded ? 'border-success' : image.error ? 'border-danger' : ''}`}>
                    <div className="position-relative">
                      <img 
                        src={image.preview} 
                        alt="Preview"
                        className="card-img-top"
                        style={{ height: '150px', objectFit: 'cover' }}
                      />
                      
                      {/* Estados de carga */}
                      {image.uploading && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
                          <div className="spinner-border text-white" />
                        </div>
                      )}
                      
                      {image.uploaded && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className="badge bg-success">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </span>
                        </div>
                      )}

                      <button
                        className="btn btn-sm btn-outline-danger position-absolute top-0 start-0 m-2"
                        onClick={() => removeImage(image.id)}
                        disabled={image.uploading}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="card-body p-2">
                      <select
                        className="form-select form-select-sm mb-2"
                        value={image.imageType}
                        onChange={(e) => updateImageType(image.id, e.target.value as ImageType)}
                        disabled={image.uploading || image.uploaded}
                      >
                        {IMAGE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      <small className="text-muted">
                        {(image.file.size / 1024 / 1024).toFixed(1)}MB
                      </small>
                      
                      {image.error && (
                        <div className="small text-danger mt-1">
                          {image.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}