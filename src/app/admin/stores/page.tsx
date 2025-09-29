'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Store } from '@/types/store'

export default function AdminStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stores', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStores(data.data.stores || [])
      } else {
        console.error('Error fetching stores')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])


  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tienda?')) {
      return
    }

    try {
      const response = await fetch(`/api/stores/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        fetchStores()
      } else {
        alert('Error al eliminar la tienda')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la tienda')
    }
  }

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.phone && store.phone.includes(searchTerm)) ||
    (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center loading-container">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando tiendas...</h5>
          <small className="text-muted">Esto puede tomar unos segundos</small>
        </div>
        <style jsx>{`
          .loading-container {
            height: 300px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">Tiendas</h2>
            <div className="d-flex align-items-center gap-3 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success rounded-circle status-indicator"></div>
                <span>Total de tiendas: <strong className="text-dark">{stores.length}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Link href="/admin/stores/new" className="btn btn-gradient btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Tienda
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
            placeholder="Buscar por nombre o email..."
            className="form-control ps-5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-muted clear-search-btn"
              title="Limpiar búsqueda"
              aria-label="Limpiar búsqueda"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stores Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Logo</th>
              <th>Tienda</th>
              <th>Contacto</th>
              <th>Precios</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <tr key={store.documentId}>
                  <td>
                    {store.logoUrl ? (
                      <img 
                        src={store.logoUrl} 
                        alt={store.name} 
                        width="40" 
                        height="40"
                        className="store-logo"
                      />
                    ) : (
                      <div className="bg-light d-flex align-items-center justify-content-center store-logo-placeholder">
                        <i className="bi bi-shop text-muted"></i>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="fw-semibold">{store.name}</div>
                    {store.address && <div className="text-muted small">{store.address}</div>}
                  </td>
                  <td>
                    <div>{store.email}</div>
                    {store.phone && <div className="text-muted small">{store.phone}</div>}
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="badge bg-success mb-1">Grading: ${store.gradingPrice}</span>
                      <span className="badge bg-info">Mystery: ${store.mysteryPackPrice}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${store.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                      {store.status}
                    </span>
                  </td>
                  <td>
                    <div className="text-muted small">
                      {new Date(store.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <Link
                        href={`/admin/stores/${store.documentId}`}
                        className="btn btn-outline-info"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/stores/${store.documentId}/edit`}
                        className="btn btn-outline-primary"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(store.documentId)}
                        className="btn btn-outline-danger"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <div className="text-muted">
                    {searchTerm ? 'No se encontraron tiendas que coincidan con la búsqueda' : 'No hay tiendas registradas'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style jsx>{`
        .loading-container {
          height: 300px;
        }
        .status-indicator {
          width: 8px;
          height: 8px;
        }
        .clear-search-btn {
          font-size: 0.8rem;
        }
        .store-logo {
          object-fit: cover;
          border-radius: 4px;
        }
        .store-logo-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
