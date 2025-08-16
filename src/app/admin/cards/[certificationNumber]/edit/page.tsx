'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import CardForm from '@/components/CardForm'
import { Card, CreateCardRequest } from '@/types/card'
import { CardImageGallery } from '@/components/admin/CardImageGallery'
import { BatchImageUploader } from '@/components/admin/BatchImageUploader'

interface PageProps {
  params: Promise<{ certificationNumber: string }>
}

export default function EditCardPage({ params }: PageProps) {
  const router = useRouter()
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [certificationNumber, setCertificationNumber] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'info' | 'images'>('info')

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setCertificationNumber(resolvedParams.certificationNumber)
    }
    fetchParams()
  }, [params])

  const fetchCard = useCallback(async () => {
    try {
      const response = await fetch(`/api/cards/${certificationNumber}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const cardData = await response.json()
        setCard(cardData)
      } else {
        alert('Carta no encontrada')
        router.push('/admin')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la carta')
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }, [certificationNumber, router])

  useEffect(() => {
    if (certificationNumber) {
      fetchCard()
    }
  }, [certificationNumber, fetchCard])

  const handleSubmit = async (data: CreateCardRequest) => {
    try {
      const response = await fetch(`/api/cards/${certificationNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Carta actualizada exitosamente')
        router.push('/admin')
      } else {
        const error = await response.json()
        alert('Error al actualizar la carta: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la carta')
    }
  }

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando carta...</h5>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="text-center p-5">
        <div className="h5">Carta no encontrada</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="gradient-bg text-white rounded p-2 me-3">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="h3 mb-0 fw-bold">
              Editar Carta #{card.certificationNumber}
            </h1>
            <small className="text-muted">
              Modifica la información de la carta: {card.name}
            </small>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            type="button"
            className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <svg width="16" height="16" className="me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Información de la Carta
          </button>
        </li>
        <li className="nav-item">
          <button 
            type="button"
            className={`nav-link ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <svg width="16" height="16" className="me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Gestión de Imágenes
          </button>
        </li>
      </ul>

      {/* Contenido de tabs */}
      {activeTab === 'info' ? (
        <CardForm
          initialData={card}
          onSubmit={handleSubmit}
          submitLabel="Actualizar Carta"
        />
      ) : (
        <div className="space-y-4">
          {/* Galería de imágenes existentes */}
          <CardImageGallery 
            images={card.images}
            certificationNumber={card.certificationNumber}
            onImageDeleted={fetchCard}
          />
          
          {/* Uploader por lotes */}
          <div className="mt-4">
            <BatchImageUploader 
              certificationNumber={card.certificationNumber}
              onUploadComplete={() => fetchCard()}
            />
          </div>
        </div>
      )}
    </div>
  )
}