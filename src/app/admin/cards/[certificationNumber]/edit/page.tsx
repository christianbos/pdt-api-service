'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CardForm from '@/components/CardForm'
import { Card, CreateCardRequest } from '@/types/card'

interface PageProps {
  params: Promise<{ certificationNumber: string }>
}

export default function EditCardPage({ params }: PageProps) {
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

  useEffect(() => {
    if (certificationNumber) {
      fetchCard()
    }
  }, [certificationNumber])

  const fetchCard = async () => {
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
  }

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

      <CardForm
        initialData={card}
        onSubmit={handleSubmit}
        submitLabel="Actualizar Carta"
      />
    </div>
  )
}