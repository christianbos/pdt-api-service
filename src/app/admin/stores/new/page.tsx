'use client'

import { useRouter } from 'next/navigation'
import StoreForm from '@/components/StoreForm'
import { CreateStoreRequest, UpdateStoreRequest } from '@/types/store'

export default function NewStorePage() {
  const router = useRouter()

  const handleSubmit = async (data: CreateStoreRequest | UpdateStoreRequest) => {
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Tienda creada exitosamente')
        router.push('/admin/stores')
      } else {
        const error = await response.json()
        alert('Error al crear la tienda: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la tienda')
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
            <h1 className="h3 mb-0 fw-bold">Nueva Tienda</h1>
            <small className="text-muted">Completa la información para crear una nueva tienda en el sistema</small>
          </div>
        </div>
      </div>

      <StoreForm
        onSubmit={handleSubmit}
        submitLabel="Crear Tienda"
      />
    </div>
  )
}
