'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import OrderForm from '@/components/OrderForm'
import { Order, UpdateOrderRequest } from '@/types/order'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditOrderPage({ params }: PageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setOrderId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData.data.order)
      } else {
        alert('Orden no encontrada')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la orden')
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, fetchOrder])

  const handleSubmit = async (data: UpdateOrderRequest) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Orden actualizada exitosamente')
        router.push('/admin/orders')
      } else {
        const error = await response.json()
        alert('Error al actualizar la orden: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la orden')
    }
  }

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando orden...</h5>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center p-5">
        <div className="h5">Orden no encontrada</div>
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
              Editar Orden #{order.uuid}
            </h1>
            <small className="text-muted">
              Modifica la información de la orden de: {order.customerName}
            </small>
          </div>
        </div>
      </div>

      <OrderForm
        initialData={order}
        onSubmit={handleSubmit}
        submitLabel="Actualizar Orden"
        isEditing={true}
      />
    </div>
  )
}
