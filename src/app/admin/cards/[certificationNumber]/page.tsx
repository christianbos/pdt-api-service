'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/types/card'
import { CardImageGallery } from '@/components/admin/CardImageGallery'

interface PageProps {
  params: Promise<{ certificationNumber: string }>
}

export default function CardDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [certificationNumber, setCertificationNumber] = useState<string>('')

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="h3 mb-0 fw-bold">
              Detalle de Carta #{card.certificationNumber}
            </h1>
            <small className="text-muted">
              {card.name}
            </small>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Información General</h5>
              <span className={`badge fw-bold ${
                card.finalGrade >= 9 
                  ? 'badge-grade-high' 
                  : card.finalGrade >= 7 
                  ? 'badge-grade-medium' 
                  : 'badge-grade-low'
              }`}>
                Grado Final: {card.finalGrade}/10
              </span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre:</strong> {card.name}</p>
                  <p><strong>Set:</strong> {card.set}</p>
                  <p><strong>Número:</strong> <code>{card.number}</code></p>
                  <p><strong>Año:</strong> {card.year}</p>
                  <p><strong>TCG:</strong> {card.tcg || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Rareza:</strong> <span className="badge bg-light text-dark">{card.rarity}</span></p>
                  <p><strong>Texto de Grado:</strong> {card.gradeText || 'N/A'}</p>
                  <p><strong>Versión:</strong> {card.version}</p>
                  <p><strong>Scan 3D:</strong> {card.has3DScan ? 'Sí' : 'No'}</p>
                  <p><strong>Fecha de Gradeo:</strong> {card.gradeDate ? new Date(card.gradeDate).toLocaleDateString('es-ES') : 'N/A'}</p>
                  <p><strong>Creado:</strong> {new Date(card.createdAt).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Puntuaciones</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Superficie <span className="badge bg-primary rounded-pill">{card.surface.finalScore}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Bordes <span className="badge bg-primary rounded-pill">{card.edges.finalScore}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Esquinas <span className="badge bg-primary rounded-pill">{card.corners.finalScore}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Centrado <span className="badge bg-primary rounded-pill">{card.centering.finalScore}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Notas si existen */}
      {card.notes && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Notas</h5>
              </div>
              <div className="card-body">
                <p className="mb-0">{card.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h4 className="mb-3">Detalles de Graduación</h4>
        <div className="accordion" id="grading-details-accordion">
          {/* Surface */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="surface-heading">
              <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#surface-collapse" aria-expanded="true" aria-controls="surface-collapse">
                Superficie ({card.surface.finalScore})
              </button>
            </h2>
            <div id="surface-collapse" className="accordion-collapse collapse show" aria-labelledby="surface-heading">
              <div className="accordion-body">
                <p><strong>Puntuación por doblez:</strong> {card.surface.bent ?? 'N/A'}</p>
                <p><strong>Peso de la puntuación por doblez:</strong> {card.surface.bentWeight ?? 'N/A'}</p>
                <hr />
                <div className="row">
                  <div className="col-md-6">
                    <h6>Frente</h6>
                    <p className="mb-1"><strong>Color:</strong> {card.surface.front.color} <span className="text-muted small">(Peso: {card.surface.front.colorWeight})</span></p>
                    <p className="mb-1"><strong>Rayones:</strong> {card.surface.front.scratches} <span className="text-muted small">(Peso: {card.surface.front.scratchesWeight})</span></p>
                  </div>
                  <div className="col-md-6">
                    <h6>Reverso</h6>
                    <p className="mb-1"><strong>Color:</strong> {card.surface.back.color} <span className="text-muted small">(Peso: {card.surface.back.colorWeight})</span></p>
                    <p className="mb-1"><strong>Rayones:</strong> {card.surface.back.scratches} <span className="text-muted small">(Peso: {card.surface.back.scratchesWeight})</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edges */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="edges-heading">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#edges-collapse" aria-expanded="false" aria-controls="edges-collapse">
                Bordes ({card.edges.finalScore})
              </button>
            </h2>
            <div id="edges-collapse" className="accordion-collapse collapse" aria-labelledby="edges-heading">
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Frente</h6>
                    <p className="mb-1"><strong>Superior:</strong> {card.edges.front.top}</p>
                    <p className="mb-1"><strong>Inferior:</strong> {card.edges.front.bottom}</p>
                    <p className="mb-1"><strong>Izquierda:</strong> {card.edges.front.left}</p>
                    <p className="mb-1"><strong>Derecha:</strong> {card.edges.front.right}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Reverso</h6>
                    <p className="mb-1"><strong>Superior:</strong> {card.edges.back.top}</p>
                    <p className="mb-1"><strong>Inferior:</strong> {card.edges.back.bottom}</p>
                    <p className="mb-1"><strong>Izquierda:</strong> {card.edges.back.left}</p>
                    <p className="mb-1"><strong>Derecha:</strong> {card.edges.back.right}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Corners */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="corners-heading">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#corners-collapse" aria-expanded="false" aria-controls="corners-collapse">
                Esquinas ({card.corners.finalScore})
              </button>
            </h2>
            <div id="corners-collapse" className="accordion-collapse collapse" aria-labelledby="corners-heading">
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Frente</h6>
                    <p className="mb-1"><strong>Superior Izquierda:</strong> {card.corners.front.topLeft}</p>
                    <p className="mb-1"><strong>Superior Derecha:</strong> {card.corners.front.topRight}</p>
                    <p className="mb-1"><strong>Inferior Izquierda:</strong> {card.corners.front.bottomLeft}</p>
                    <p className="mb-1"><strong>Inferior Derecha:</strong> {card.corners.front.bottomRight}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Reverso</h6>
                    <p className="mb-1"><strong>Superior Izquierda:</strong> {card.corners.back.topLeft}</p>
                    <p className="mb-1"><strong>Superior Derecha:</strong> {card.corners.back.topRight}</p>
                    <p className="mb-1"><strong>Inferior Izquierda:</strong> {card.corners.back.bottomLeft}</p>
                    <p className="mb-1"><strong>Inferior Derecha:</strong> {card.corners.back.bottomRight}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Centering */}
          <div className="accordion-item">
            <h2 className="accordion-header" id="centering-heading">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#centering-collapse" aria-expanded="false" aria-controls="centering-collapse">
                Centrado ({card.centering.finalScore})
              </button>
            </h2>
            <div id="centering-collapse" className="accordion-collapse collapse" aria-labelledby="centering-heading">
              <div className="accordion-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Frente ({card.centering.frontScore})</h6>
                    <p className="mb-1"><strong>Izquierda:</strong> {card.centering.front.left}</p>
                    <p className="mb-1"><strong>Superior:</strong> {card.centering.front.top}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Reverso ({card.centering.backScore})</h6>
                    <p className="mb-1"><strong>Izquierda:</strong> {card.centering.back.left}</p>
                    <p className="mb-1"><strong>Superior:</strong> {card.centering.back.top}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Galería de imágenes existentes */}
      <div className="mt-4">
        <CardImageGallery 
          images={card.images}
          certificationNumber={card.certificationNumber}
          onImageDeleted={fetchCard}
        />
      </div>

      {/* Botón para editar/gestionar imágenes */}
      <div className="mt-3 text-center">
        <button 
          type="button"
          className="btn btn-outline-primary"
          onClick={() => router.push(`/admin/cards/${card.certificationNumber}/edit`)}
        >
          <svg width="16" height="16" className="me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar Carta y Gestionar Imágenes
        </button>
      </div>
    </div>
  )
}
