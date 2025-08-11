'use client'

import { CardImages } from '@/types/card'
import { generateThumbnailUrl, generateMediumUrl, generateFirebaseStorageUrl } from '@/lib/imageUtils'
import { useState } from 'react'

interface CardImageGalleryProps {
  images?: CardImages
  certificationNumber: number
}

export function CardImageGallery({ images, certificationNumber }: CardImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; publicId: string } | null>(null)

  if (!images || (!images.main && !images.specialized)) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <svg width="20" height="20" className="me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Card Images
          </h5>
        </div>
        <div className="card-body text-center text-muted">
          <p>No images available for this card.</p>
          <small>Images can be added from the edit page.</small>
        </div>
      </div>
    )
  }

  const allImages: Array<{
    type: string;
    metadata: any;
    category: string;
    label: string;
  }> = []

  // Add main images
  if (images.main) {
    Object.entries(images.main).forEach(([type, metadata]) => {
      if (metadata) {
        allImages.push({
          type,
          metadata,
          category: 'main',
          label: type === 'front' ? 'Front' : 'Back'
        })
      }
    })
  }

  // Add specialized images
  if (images.specialized) {
    Object.entries(images.specialized).forEach(([type, metadata]) => {
      if (metadata) {
        const labels: Record<string, string> = {
          'front_corner_topLeft': 'Front Corner TL',
          'front_corner_topRight': 'Front Corner TR',
          'front_corner_bottomLeft': 'Front Corner BL',
          'front_corner_bottomRight': 'Front Corner BR',
          'back_corner_topLeft': 'Back Corner TL',
          'back_corner_topRight': 'Back Corner TR',
          'back_corner_bottomLeft': 'Back Corner BL',
          'back_corner_bottomRight': 'Back Corner BR',
          'front_edges': 'Front Edges',
          'back_edges': 'Back Edges',
          'front_surface': 'Front Surface',
          'back_surface': 'Back Surface'
        }
        
        allImages.push({
          type,
          metadata,
          category: 'specialized',
          label: labels[type] || type
        })
      }
    })
  }

  const getImageUrl = (image: any) => {
    // Use Firebase Storage with token if available
    if (image.metadata.token) {
      return generateFirebaseStorageUrl(image.metadata.publicId, image.metadata.token);
    }
    // Fallback to public URL or generate Firebase URL without token
    return image.metadata.url || generateFirebaseStorageUrl(image.metadata.publicId);
  };

  return (
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <svg width="20" height="20" className="me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Card Images
          </h5>
          <span className="badge bg-secondary">
            {allImages.length} image{allImages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="card-body">
          {allImages.length === 0 ? (
            <div className="text-center text-muted">
              <p>No images available for this card.</p>
            </div>
          ) : (
            <div className="row g-3">
              {allImages.map((image) => (
                <div key={`${image.category}-${image.type}`} className="col-6 col-md-4 col-lg-3">
                  <div className="position-relative">
                    <img
                      src={getImageUrl(image)}
                      alt={image.label}
                      className="img-fluid rounded shadow-sm cursor-pointer hover-zoom"
                      style={{ 
                        aspectRatio: '4/3', 
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onError={(e) => {
                        const currentSrc = e.currentTarget.src
                        const publicId = image.metadata?.publicId
                        
                        console.error('Error loading image:', {
                          original: currentSrc,
                          publicId: publicId || 'undefined',
                          metadata: image.metadata || 'undefined',
                          imageType: image.type,
                          imageCategory: image.category
                        })
                        
                        // Only try fallbacks if we have valid metadata
                        if (!image.metadata || !publicId) {
                          console.error('Cannot create fallbacks - missing metadata or publicId')
                          return
                        }
                        
                        // Try different fallback URLs
                        const fallbacks = [
                          // Try with token if not already used
                          image.metadata.token && !currentSrc.includes('token=') ? 
                            generateFirebaseStorageUrl(publicId, image.metadata.token) : null,
                          // Try without token
                          !currentSrc.includes('token=') ? 
                            generateFirebaseStorageUrl(publicId) : null,
                          // Try thumbnail URL
                          generateThumbnailUrl(publicId),
                          // Try original metadata URL
                          image.metadata.url
                        ].filter(Boolean)
                        
                        // Find first fallback that hasn't been tried yet
                        const nextFallback = fallbacks.find(url => url !== currentSrc)
                        if (nextFallback) {
                          console.log('Trying fallback URL:', nextFallback)
                          e.currentTarget.src = nextFallback
                        } else {
                          console.error('All fallbacks exhausted for image:', publicId)
                        }
                      }}
                      onClick={() => {
                        if (image.metadata?.publicId) {
                          setSelectedImage({ 
                            url: image.metadata.url || generateMediumUrl(image.metadata.publicId), 
                            publicId: image.metadata.publicId 
                          })
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-2 rounded-bottom">
                      <small className="fw-bold">{image.label}</small>
                      <div className="small opacity-75">
                        {image.metadata.width}×{image.metadata.height} • {(image.metadata.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for enlarged image */}
      {selectedImage && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-transparent border-0">
              <div className="position-relative">
                <img
                  src={selectedImage.url}
                  alt="Enlarged image"
                  className="img-fluid rounded"
                  style={{ width: '100%', height: 'auto' }}
                />
                <button
                  type="button"
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                  onClick={() => setSelectedImage(null)}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                ></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
