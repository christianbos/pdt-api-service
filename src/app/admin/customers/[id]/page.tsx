'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Customer } from '@/types/customer'
import { Order } from '@/types/order'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CustomerDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setCustomerId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  const fetchCustomerAndOrders = useCallback(async () => {
    if (!customerId) return
    try {
      // Fetch customer details
      const customerResponse = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        setCustomer(customerData.data.customer)

        // Fetch customer orders
        try {
          const ordersResponse = await fetch(`/api/orders?customerId=${customerId}`, {
             headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
            }
          })
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json()
            setOrders(ordersData.data?.orders || [])
          }
        } catch (orderError) {
          console.log('No orders found for customer:', orderError)
          setOrders([])
        }

      } else {
        alert('Cliente no encontrado')
        router.push('/admin/customers')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el cliente y sus ordenes')
      router.push('/admin/customers')
    } finally {
      setLoading(false)
    }
  }, [customerId, router])

  useEffect(() => {
    if (customerId) {
      fetchCustomerAndOrders()
    }
  }, [customerId, fetchCustomerAndOrders])

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
          <div>
            <h1 className="h3 mb-0 fw-bold">
              Detalle de Cliente #{customer.documentId}
            </h1>
            <small className="text-muted">
              {customer.name}
            </small>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Información General</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre:</strong> {customer.name}</p>
                  <p><strong>Teléfono:</strong> {customer.phone}</p>
                  <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Total de Órdenes:</strong> <span className="badge bg-light text-dark">{customer.totalOrders || 0}</span></p>
                  <p><strong>Gasto Total:</strong> <span className="badge bg-success-light text-success">${(customer.totalSpent || 0).toFixed(2)}</span></p>
                  <p><strong>Fecha de Registro:</strong> {new Date(customer.createdAt).toLocaleString('es-ES')}</p>
                  <p><strong>Última Actualización:</strong> {new Date(customer.updatedAt).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="mt-4">
        <h4 className="mb-3">Órdenes del Cliente</h4>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>ID de Orden</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.documentId}>
                  <td><span className="badge bg-primary">#{order.uuid}</span></td>
                  <td><span className={`badge bg-secondary`}>{order.status}</span></td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('es-ES')}</td>
                  <td>
                    <Link href={`/admin/orders/${order.documentId}`} className="btn btn-sm btn-outline-info">Ver Orden</Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">No hay órdenes para este cliente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
