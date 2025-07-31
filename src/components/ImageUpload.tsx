'use client'

import { useState, useCallback } from 'react'

interface ImageUploadProps {
  certificationNumber: number
}

export default function ImageUpload({ certificationNumber }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Por favor selecciona solo archivos de imagen')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      imageFiles.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(`/api/cards/${certificationNumber}/images`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setImages(prev => [...prev, ...data.images])
        alert(`${data.images.length} imagen(es) subida(s) exitosamente`)
      } else {
        const error = await response.json()
        alert('Error al subir imágenes: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir imágenes')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  return (
    <div>
      {/* Upload Area */}
      <div
        className={`position-relative border border-2 border-dashed rounded p-4 mb-4 ${
          dragActive
            ? 'border-primary bg-primary bg-opacity-10'
            : 'border-secondary'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <svg
            width="48"
            height="48"
            className="mx-auto text-muted mb-3"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <label htmlFor="file-upload" className="btn btn-outline-primary">
              {uploading ? 'Subiendo imágenes...' : 'Seleccionar imágenes'}
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="d-none"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </label>
            <p className="mt-2 small text-muted">
              Arrastra imágenes aquí o usa el botón. PNG, JPG, JPEG hasta 10MB cada una
            </p>
          </div>
        </div>

        {uploading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center rounded">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="small text-muted">Subiendo...</span>
            </div>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="mb-4">
          <h6 className="mb-3">
            Imágenes subidas ({images.length})
          </h6>
          <div className="row g-2">
            {images.map((image, index) => (
              <div key={index} className="col-6 col-md-4 col-lg-3">
                <div className="position-relative">
                  <img
                    src={image}
                    alt={`Card image ${index + 1}`}
                    className="img-fluid rounded border"
                    style={{height: '100px', objectFit: 'cover', width: '100%'}}
                  />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-1"
                    style={{width: '24px', height: '24px', fontSize: '12px', lineHeight: '1'}}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="small text-muted">
        <p className="fw-medium">Consejos para mejores resultados:</p>
        <ul className="mt-2 ps-3">
          <li>Usa imágenes de alta calidad (mínimo 1000px de ancho)</li>
          <li>Incluye fotos del frente y reverso de la carta</li>
          <li>Asegúrate de que la iluminación sea uniforme</li>
          <li>Evita reflejos y sombras</li>
        </ul>
      </div>
    </div>
  )
}