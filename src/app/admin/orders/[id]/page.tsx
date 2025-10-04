'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Order, OrderStatus } from '@/types/order'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { StatusDropdown } from '@/components/admin/StatusDropdown'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string>('')
  const [cards, setCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState(false)

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

  const fetchOrderCards = useCallback(async () => {
    if (!orderId) return
    try {
      setLoadingCards(true)
      const response = await fetch(`/api/orders/${orderId}/cards`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCards(data.data || [])
      } else {
        console.error('Error fetching order cards')
        setCards([])
      }
    } catch (error) {
      console.error('Error:', error)
      setCards([])
    } finally {
      setLoadingCards(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) {
      fetchOrderCards()
    }
  }, [orderId, fetchOrderCards])

  const getProductDisplayName = (productType: string) => {
    return productType === 'grading' ? 'Grading Service' : 'Mystery Pack'
  }

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (order) {
      setOrder({ ...order, status: newStatus, updatedAt: new Date().toISOString() })
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
        <Link href="/admin/orders" className="btn btn-primary">
          Volver a Órdenes
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4">
      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 1.5rem;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #dee2e6;
        }
        
        .timeline-item {
          position: relative;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        
        .timeline-marker {
          position: absolute;
          left: -1.5rem;
          top: 2px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px solid #dee2e6;
          border-radius: 50%;
        }
        
        .timeline-item.completed .timeline-marker {
          border-color: #198754;
          background: #198754;
          color: white;
        }
        
        .timeline-item.current .timeline-marker {
          border-color: #0d6efd;
          background: white;
        }
        
        .timeline-content {
          padding-left: 0.5rem;
        }
      `}</style>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h3 mb-0 fw-bold">
              Orden #{order.uuid}
            </h1>
            <small className="text-muted">
              ID: {order.documentId}
            </small>
          </div>
          <div className="d-flex gap-2">
            <a
              href={`https://www.pdtgrading.com/track/${order.uuid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-success"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
              </svg>
              Tracking Público
            </a>
            <Link
              href={`/admin/orders/${order.documentId}/edit`}
              className="btn btn-outline-primary"
            >
              Editar
            </Link>
            <Link href="/admin/orders" className="btn btn-outline-secondary">
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Información General</h5>
              <StatusDropdown
                orderId={order.documentId}
                currentStatus={order.status}
                onStatusChange={handleStatusChange}
              />
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Cliente:</strong> {order.customerName}</p>
                  {order.customerId && (
                    <p><strong>ID Cliente:</strong> <code>{order.customerId}</code></p>
                  )}
                  <p><strong>Tienda:</strong> {order.storeName ? (
                    <span>
                      {order.storeName}
                      {order.storeId && <><br/><small className="text-muted">ID: {order.storeId}</small></>}
                    </span>
                  ) : (
                    <span className="badge bg-info">Cliente Directo</span>
                  )}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Total:</strong> <span className="badge bg-success fs-6">${order.total.toFixed(0)}</span></p>
                  <p><strong>Fecha de Creación:</strong> {new Date(order.createdAt).toLocaleString('es-ES')}</p>
                  <p><strong>Última Actualización:</strong> {new Date(order.updatedAt).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Timeline de Estados</h5>
            </div>
            <div className="card-body">
              {order.timeline && order.timeline.length > 0 ? (
                <div className="timeline">
                  {order.timeline.map((entry, index) => (
                    <div key={index} className={`timeline-item ${entry.status}`}>
                      <div className="timeline-marker">
                        {entry.status === 'completed' && (
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-success">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                        )}
                        {entry.status === 'current' && (
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        )}
                        {entry.status === 'pending' && (
                          <div className="bg-light rounded-circle" style={{width: '16px', height: '16px'}}></div>
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="fw-semibold">{entry.title}</div>
                        <div className="text-muted small">{entry.description}</div>
                        {entry.date && (
                          <div className="text-muted small">
                            {new Date(entry.date).toLocaleString('es-ES')}
                          </div>
                        )}
                        {entry.performedBy && (
                          <div className="text-muted small">Por: {entry.performedBy}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted">
                  <p>No hay timeline disponible</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body d-grid gap-2">
              <a
                href={`https://www.pdtgrading.com/track/${order.uuid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                Ver Tracking Público
              </a>
              <Link
                href={`/admin/orders/${order.documentId}/edit`}
                className="btn btn-outline-primary"
              >
                Editar Orden
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mt-4">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Productos en la Orden</h5>
          </div>
          <div className="card-body">
            {order.items && order.items.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <span className={`badge ${item.productType === 'grading' ? 'bg-success' : 'bg-warning'}`}>
                            {getProductDisplayName(item.productType)}
                          </span>
                        </td>
                        <td>{item.quantity}</td>
                        <td>${(item.unitPrice || 0).toFixed(0)}</td>
                        <td><strong>${(item.subtotal || 0).toFixed(0)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-info">
                      <td colSpan={3}><strong>Total</strong></td>
                      <td><strong>${order.total.toFixed(0)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <p>No hay productos en esta orden</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-4">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Cartas Asignadas a la Orden</h5>
          </div>
          <div className="card-body">
            {loadingCards ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando cartas...</span>
                </div>
                <p className="mt-2 text-muted">Cargando cartas...</p>
              </div>
            ) : cards && cards.length > 0 ? (
              <div className="row g-3">
                {cards.map((card, index) => (
                  <div key={card.documentId || index} className="col-md-6 col-lg-4">
                    <div className="card bg-light border">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="card-title mb-1">{card.name}</h6>
                            <small className="text-muted">#{card.certificationNumber}</small>
                          </div>
                          {card.finalGrade && (
                            <span className="badge bg-primary">{card.finalGrade}</span>
                          )}
                        </div>
                        <div className="row g-2 small text-muted">
                          <div className="col-6">
                            <strong>Set:</strong> {card.set || 'N/A'}
                          </div>
                          <div className="col-6">
                            <strong>Año:</strong> {card.year || 'N/A'}
                          </div>
                          <div className="col-12">
                            <strong>Rareza:</strong> {card.rarity || 'N/A'}
                          </div>
                        </div>
                        {card.notes && (
                          <div className="mt-2">
                            <small className="text-muted">
                              <strong>Notas:</strong> {card.notes}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="mb-3">
                  <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                  <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
                <p>No hay cartas asignadas a esta orden</p>
                <p className="small">Las cartas se pueden asignar al editar la orden</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}