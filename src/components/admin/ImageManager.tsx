'use client'

import { useState } from 'react'
import { ImageType, CardImages } from '@/types/card'
import { ImageUploadCard } from './ImageUploadCard'

const IMAGE_TYPES: {[key: string]: ImageType[]} = {
  'Main': ['front', 'back'],
  'Front Corners': [
    'front_corner_topLeft', 
    'front_corner_topRight', 
    'front_corner_bottomLeft', 
    'front_corner_bottomRight'
  ],
  'Specialized': [
    'front_edges', 
    'back_edges', 
    'front_surface', 
    'back_surface'
  ]
}

interface ImageManagerProps {
  certificationNumber: number
  existingImages?: CardImages
  onImagesUpdate: () => void
}

export function ImageManager({ certificationNumber, existingImages, onImagesUpdate }: ImageManagerProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const handleUpload = async (file: File, imageType: ImageType) => {
    setUploading(prev => ({...prev, [imageType]: true}))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('imageType', imageType)

      const response = await fetch(`/api/admin/cards/${certificationNumber}/images`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        // Actualizar inmediatamente
        onImagesUpdate()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading image')
    } finally {
      setUploading(prev => ({...prev, [imageType]: false}))
    }
  }

  const handleDelete = async (imageType: ImageType) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      const response = await fetch(`/api/cards/${certificationNumber}/images/${imageType}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        onImagesUpdate()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting image')
    }
  }

  const getExistingImage = (imageType: ImageType) => {
    if (!existingImages) return null
    
    // Check main first
    if (existingImages.main && existingImages.main[imageType as keyof typeof existingImages.main]) {
      return existingImages.main[imageType as keyof typeof existingImages.main]
    }
    
    // Then check specialized
    if (existingImages.specialized && existingImages.specialized[imageType as keyof typeof existingImages.specialized]) {
      return existingImages.specialized[imageType as keyof typeof existingImages.specialized]
    }
    
    return null
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <svg width="20" height="20" className="me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Image Management
        </h5>
      </div>
      <div className="card-body">
        {Object.entries(IMAGE_TYPES).map(([category, types]) => (
          <div key={category} className="mb-4">
            <h6 className="text-primary mb-3 border-bottom pb-2">{category}</h6>
            <div className="row">
              {types.map(type => (
                <div key={type} className="col-md-6 col-lg-4 mb-3">
                  <ImageUploadCard
                    imageType={type}
                    certificationNumber={certificationNumber}
                    existing={getExistingImage(type)}
                    uploading={uploading[type] || false}
                    onUpload={(file) => handleUpload(file, type)}
                    onDelete={() => handleDelete(type)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
