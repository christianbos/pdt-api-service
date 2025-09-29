'use client'

import { useRouter } from 'next/navigation'
import OrderForm from '@/components/OrderForm'
import { CreateOrderRequest, UpdateOrderRequest } from '@/types/order'

export default function NewOrderPage() {
  const router = useRouter()

  const handleSubmit = async (data: CreateOrderRequest | UpdateOrderRequest) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Orden creada exitosamente')
        router.push('/admin/orders')
      } else {
        const error = await response.json()
        alert('Error al crear la orden: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la orden')
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
            <h1 className="h3 mb-0 fw-bold">Nueva Orden</h1>
            <small className="text-muted">Completa la información para crear una nueva orden en el sistema</small>
          </div>
        </div>
      </div>

      <OrderForm
        onSubmit={handleSubmit}
        submitLabel="Crear Orden"
      />
    </div>
  )
}
