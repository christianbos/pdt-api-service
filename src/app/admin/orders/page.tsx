'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Order, OrderStatus } from '@/types/order'
import { StatusDropdown } from '@/components/admin/StatusDropdown'

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const ordersPerPage = 20

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * ordersPerPage
      let url = `/api/orders?limit=${ordersPerPage}&offset=${offset}`
      const response = await fetch(url, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data.orders || [])
        setTotalOrders(data.data.pagination?.total || 0)
      } else {
        console.error('Error fetching orders')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, ordersPerPage])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])


  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        fetchOrders()
      } else {
        alert('Error al eliminar la orden')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la orden')
    }
  }

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    // Actualizar el estado local inmediatamente para mejor UX
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.documentId === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    )
  }

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.documentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalOrders / ordersPerPage)

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando órdenes...</h5>
          <small className="text-muted">Esto puede tomar unos segundos</small>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">Órdenes</h2>
            <div className="d-flex align-items-center gap-3 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success rounded-circle" style={{width: '8px', height: '8px'}}></div>
                <span>Total de órdenes: <strong className="text-dark">{totalOrders}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Link href="/admin/orders/new" className="btn btn-gradient btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Orden
            </Link>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-4">
        <div className="position-relative">
          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente, tienda, UUID..."
            className="form-control ps-5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-muted"
              style={{fontSize: '0.8rem'}}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>ID de Orden</th>
              <th>Cliente</th>
              <th>Tienda</th>
              <th>Productos</th>
              <th>Cartas</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.documentId}>
                <td>
                    <span className="badge bg-primary">#{order.uuid}</span>
                </td>
                <td>
                  <div className="fw-semibold">{order.customerName}</div>
                  {order.customerId && (
                    <small className="text-muted">ID: {order.customerId.slice(-8)}</small>
                  )}
                </td>
                <td>
                  {order.storeName ? (
                    <div>
                      <div className="fw-semibold">{order.storeName}</div>
                      <small className="text-muted">Tienda</small>
                    </div>
                  ) : (
                    <span className="badge bg-info">Cliente Directo</span>
                  )}
                </td>
                <td>
                  <div className="d-flex flex-column gap-1">
                    {order.items?.map((item, index) => (
                      <span key={index} className={`badge ${item.productType === 'grading' ? 'bg-success' : 'bg-warning'}`}>
                        {item.quantity}x {item.productType === 'grading' ? 'Grading' : 'Mystery Pack'}
                      </span>
                    )) || <span className="text-muted">-</span>}
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {order.cardIds && order.cardIds.length > 0 ? (
                      <>
                        <span className="badge bg-secondary">
                          {order.cardIds.length} {order.cardIds.length === 1 ? 'carta' : 'cartas'}
                        </span>
                        <Link
                          href={`/admin/orders/${order.documentId}`}
                          className="btn btn-outline-secondary btn-sm"
                          title="Ver cartas asignadas"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small">Sin cartas</span>
                        <Link
                          href={`/admin/orders/${order.documentId}`}
                          className="btn btn-outline-primary btn-sm"
                          title="Asignar cartas"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <strong>${order.total.toFixed(0)}</strong>
                </td>
                <td>
                  <StatusDropdown
                    orderId={order.documentId}
                    currentStatus={order.status}
                    onStatusChange={(newStatus) => handleStatusChange(order.documentId, newStatus)}
                  />
                </td>
                <td>
                  <small>{new Date(order.createdAt).toLocaleDateString('es-ES')}</small>
                </td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <a
                      href={`https://www.pdtgrading.com/track/${order.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-success"
                      title="Ver tracking público"
                    >
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                      </svg>
                    </a>
                    <Link
                      href={`/admin/orders/${order.documentId}`}
                      className="btn btn-outline-info"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/orders/${order.documentId}/edit`}
                      className="btn btn-outline-primary"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(order.documentId)}
                      className="btn btn-outline-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <div className="text-muted small">
            Mostrando {((currentPage - 1) * ordersPerPage) + 1} a {Math.min(currentPage * ordersPerPage, totalOrders)} de {totalOrders} órdenes
          </div>
          
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
              </li>
              
              {[...Array(totalPages)].map((_, index) => (
                <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}
