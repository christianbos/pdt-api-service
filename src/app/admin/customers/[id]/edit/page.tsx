'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import CustomerForm from '@/components/CustomerForm'
import { Customer, UpdateCustomerRequest } from '@/types/customer'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditCustomerPage({ params }: PageProps) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setCustomerId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const customerData = await response.json()
        setCustomer(customerData.data.customer)
      } else {
        alert('Cliente no encontrado')
        router.push('/admin/customers')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el cliente')
      router.push('/admin/customers')
    } finally {
      setLoading(false)
    }
  }, [customerId, router])

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId, fetchCustomer])

  const handleSubmit = async (data: UpdateCustomerRequest) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Cliente actualizado exitosamente')
        router.push('/admin/customers')
      } else {
        const error = await response.json()
        alert('Error al actualizar el cliente: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el cliente')
    }
  }

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando cliente...</h5>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center p-5">
        <div className="h5">Cliente no encontrado</div>
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
              Editar Cliente #{customer.id}
            </h1>
            <small className="text-muted">
              Modifica la información del cliente: {customer.name}
            </small>
          </div>
        </div>
      </div>

      <CustomerForm
        initialData={customer}
        onSubmit={handleSubmit}
        submitLabel="Actualizar Cliente"
      />
    </div>
  )
}
