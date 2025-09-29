'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Customer } from '@/types/customer'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const customersPerPage = 20

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * customersPerPage
      let url = `/api/customers?limit=${customersPerPage}&offset=${offset}`
      const response = await fetch(url, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data.customers || [])
        setTotalCustomers(data.data.pagination?.total || 0)
      } else {
        console.error('Error fetching customers')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, customersPerPage])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])


  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        fetchCustomers()
      } else {
        alert('Error al eliminar el cliente')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el cliente')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalCustomers / customersPerPage)

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando clientes...</h5>
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
            <h2 className="mb-2">Clientes</h2>
            <div className="d-flex align-items-center gap-3 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success rounded-circle" style={{width: '8px', height: '8px'}}></div>
                <span>Total de clientes: <strong className="text-dark">{totalCustomers}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Link href="/admin/customers/new" className="btn btn-gradient btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Cliente
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
            placeholder="Buscar por nombre, teléfono o email..."
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

      {/* Customers Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Fecha de Registro</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.documentId}>
                <td>
                  <div className="fw-semibold">{customer.name}</div>
                </td>
                <td>
                  <div>{customer.phone}</div>
                  {customer.email && <div className="text-muted small">{customer.email}</div>}
                </td>
                <td>
                  {new Date(customer.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <Link
                      href={`/admin/customers/${customer.documentId}`}
                      className="btn btn-outline-info"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/customers/${customer.documentId}/edit`}
                      className="btn btn-outline-primary"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(customer.documentId)}
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
            Mostrando {((currentPage - 1) * customersPerPage) + 1} a {Math.min(currentPage * customersPerPage, totalCustomers)} de {totalCustomers} clientes
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
