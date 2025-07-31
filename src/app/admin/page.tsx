'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/types/card'

export default function AdminDashboard() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCards, setTotalCards] = useState(0)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)
  const cardsPerPage = 20

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * cardsPerPage
      let url = `/api/cards?limit=${cardsPerPage}&offset=${offset}`
      if (sortOrder) {
        url += `&sort=${sortOrder}`
      }
      const response = await fetch(url, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCards(data.data || [])
        setTotalCards(data.meta?.pagination?.total || 0)
      } else {
        console.error('Error fetching cards')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, sortOrder, cardsPerPage])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])


  const handleDelete = async (certificationNumber: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carta?')) {
      return
    }

    try {
      const response = await fetch(`/api/cards/${certificationNumber}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        fetchCards()
      } else {
        alert('Error al eliminar la carta')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la carta')
    }
  }

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.certificationNumber.toString().includes(searchTerm)
  )

  const totalPages = Math.ceil(totalCards / cardsPerPage)

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando cartas...</h5>
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
            <h2 className="mb-2">Dashboard</h2>
            <div className="d-flex align-items-center gap-3 text-muted small">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success rounded-circle" style={{width: '8px', height: '8px'}}></div>
                <span>Total de cartas: <strong className="text-dark">{totalCards}</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Última actualización: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Link href="/admin/import" className="btn btn-outline-success btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Excel
            </Link>
            <Link href="/admin/cards/new" className="btn btn-gradient btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Carta
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
            placeholder="Buscar por nombre o número de certificación..."
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

      {/* Cards Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Carta</th>
              <th>Set / Número</th>
              <th>
                <button 
                  className="btn btn-link text-decoration-none p-0" 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  Certificación
                  {sortOrder === 'asc' && ' ↑'}
                  {sortOrder === 'desc' && ' ↓'}
                </button>
              </th>
              <th>Grado Final</th>
              <th>Fecha</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card) => (
              <tr key={card.certificationNumber} className="card-hover">
                <td>
                  <div className="d-flex align-items-center">
                    <div className="gradient-bg text-white rounded p-2 me-3" style={{width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="fw-semibold text-truncate" style={{maxWidth: '200px'}}>
                        {card.name}
                      </div>
                      <span className="badge bg-light text-dark small mt-1">
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="fw-medium">{card.set}</div>
                  <code className="small bg-light px-2 py-1 rounded">
                    {card.number}
                  </code>
                </td>
                <td>
                  <span className="badge bg-primary">
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    #{card.certificationNumber}
                  </span>
                </td>
                <td>
                  <span className={`badge fw-bold ${
                    card.finalGrade >= 9 
                      ? 'badge-grade-high' 
                      : card.finalGrade >= 7 
                      ? 'badge-grade-medium' 
                      : 'badge-grade-low'
                  }`}>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" className="me-1">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {card.finalGrade}/10
                  </span>
                </td>
                <td>
                  <div className="small">
                    {new Date(card.createdAt).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="text-muted" style={{fontSize: '0.75rem'}}>
                    {new Date(card.createdAt).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <Link
                      href={`/admin/cards/${card.certificationNumber}`}
                      className="btn btn-outline-info"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </Link>
                    <Link
                      href={`/admin/cards/${card.certificationNumber}/edit`}
                      className="btn btn-outline-primary"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(card.certificationNumber)}
                      className="btn btn-outline-danger"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="text-center py-5">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mx-auto text-muted mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h5>No se encontraron cartas</h5>
            <p className="text-muted">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera carta'}
            </p>
            {!searchTerm && (
              <Link href="/admin/cards/new" className="btn btn-gradient mt-3">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Carta
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <div className="text-muted small">
            Mostrando {((currentPage - 1) * cardsPerPage) + 1} a {Math.min(currentPage * cardsPerPage, totalCards)} de {totalCards} cartas
          </div>
          
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="me-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
              </li>
              
              {[...Array(Math.min(totalPages, 3))].map((_, index) => {
                let pageNumber = currentPage <= 2 ? index + 1 : currentPage - 1 + index;
                if (pageNumber > totalPages) return null;
                
                return (
                  <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  </li>
                );
              })}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="ms-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}