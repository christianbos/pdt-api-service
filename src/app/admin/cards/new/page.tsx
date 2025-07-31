'use client'

import { useRouter } from 'next/navigation'
import CardForm from '@/components/CardForm'
import { CreateCardRequest } from '@/types/card'

export default function NewCardPage() {
  const router = useRouter()

  const handleSubmit = async (data: CreateCardRequest) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Carta creada exitosamente')
        router.push('/admin')
      } else {
        const error = await response.json()
        alert('Error al crear la carta: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la carta')
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="gradient-bg text-white rounded p-2 me-3">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h1 className="h3 mb-0 fw-bold">Nueva Carta</h1>
            <small className="text-muted">Completa la información para crear una nueva carta en el sistema</small>
          </div>
        </div>
      </div>

      <CardForm
        onSubmit={handleSubmit}
        submitLabel="Crear Carta"
      />
    </div>
  )
}