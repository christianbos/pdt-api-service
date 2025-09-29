'use client'

import { useState, useCallback } from 'react'

interface LogoUploadProps {
  onUpload: (url: string) => void
  initialUrl?: string
}

export default function LogoUpload({ onUpload, initialUrl }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(initialUrl || '')
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

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFile = files[0]
    
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB')
      return
    }

    setUploading(true)

    try {
      // Crear preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        onUpload(result) // Por ahora usamos la URL local, después puedes implementar upload a servidor
      }
      reader.readAsDataURL(imageFile)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la imagen')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles([e.dataTransfer.files[0]])
    }
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles([e.target.files[0]])
    }
  }

  const handleUrlInput = (url: string) => {
    setPreviewUrl(url)
    onUpload(url)
  }

  const removeLogo = () => {
    setPreviewUrl('')
    onUpload('')
  }

  return (
    <div>
      {/* Current Logo Preview */}
      {previewUrl && (
        <div className="mb-3">
          <div className="d-flex align-items-center gap-3">
            <img 
              src={previewUrl} 
              alt="Logo preview" 
              className="logo-preview border rounded"
            />
            <button 
              type="button"
              onClick={removeLogo}
              className="btn btn-outline-danger btn-sm"
              title="Eliminar logo"
            >
              <i className="bi bi-trash"></i>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`upload-area border border-2 border-dashed rounded p-3 mb-3 ${
          dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <i className="bi bi-cloud-upload fs-2 text-muted mb-2 d-block"></i>
          <div>
            <label htmlFor="logo-upload" className="btn btn-outline-primary btn-sm">
              {uploading ? 'Subiendo...' : 'Seleccionar Logo'}
              <input
                id="logo-upload"
                name="logo-upload"
                type="file"
                className="d-none"
                accept="image/*"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </label>
            <p className="mt-2 small text-muted mb-0">
              Arrastra una imagen aquí o usa el botón
            </p>
            <p className="small text-muted mb-0">
              PNG, JPG, JPEG hasta 5MB
            </p>
          </div>
        </div>

        {uploading && (
          <div className="uploading-overlay d-flex align-items-center justify-content-center">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Subiendo...</span>
              </div>
              <span className="small text-muted">Procesando imagen...</span>
            </div>
          </div>
        )}
      </div>

      {/* URL Input Alternative */}
      <div className="mb-2">
        <label className="form-label small">O ingresa una URL de imagen:</label>
        <div className="input-group">
          <input
            type="url"
            className="form-control"
            placeholder="https://ejemplo.com/logo.png"
            value={previewUrl}
            onChange={(e) => handleUrlInput(e.target.value)}
          />
        </div>
      </div>

      <style jsx>{`
        .logo-preview {
          width: 80px;
          height: 80px;
          object-fit: cover;
        }
        .upload-area {
          position: relative;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .uploading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 0.375rem;
        }
      `}</style>
    </div>
  )
}