'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Store } from '@/types/store'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function StoreDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string>('')

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setStoreId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  const fetchStore = useCallback(async () => {
    if (!storeId) return
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const storeData = await response.json()
        setStore(storeData.data.store)
      } else {
        alert('Tienda no encontrada')
        router.push('/admin/stores')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la tienda')
      router.push('/admin/stores')
    } finally {
      setLoading(false)
    }
  }, [storeId, router])

  useEffect(() => {
    if (storeId) {
      fetchStore()
    }
  }, [storeId, fetchStore])

  if (loading) {
    return (
      <div className="p-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{height: '300px'}}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Cargando tienda...</h5>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center p-5">
        <div className="h5">Tienda no encontrada</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          {store.logoUrl && (
            <img 
              src={store.logoUrl} 
              alt={store.name} 
              className="me-3" 
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} 
            />
          )}
          <div>
            <h1 className="h3 mb-0 fw-bold">
              {store.name}
            </h1>
            <small className="text-muted">
              ID: {store.documentId}
            </small>
          </div>
        </div>
      </div>

      {/* Store Details */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Información General</h5>
              <span className={`badge ${store.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{store.status}</span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nombre:</strong> {store.name}</p>
                  <p><strong>Email:</strong> {store.email}</p>
                  <p><strong>Teléfono:</strong> {store.phone || 'No especificado'}</p>
                  <p><strong>Dirección:</strong> {store.address || 'No especificada'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Precio Grading:</strong> <span className="badge bg-success">${store.gradingPrice}</span></p>
                  <p><strong>Precio Mystery Pack:</strong> <span className="badge bg-info">${store.mysteryPackPrice}</span></p>
                  <p><strong>Fecha de Creación:</strong> {new Date(store.createdAt).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body d-grid gap-2">
              <button 
                className="btn btn-outline-primary" 
                onClick={() => router.push(`/admin/stores/${store.documentId}/edit`)}
              >
                <i className="bi bi-pencil me-2"></i>
                Editar Tienda
              </button>
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => router.push('/admin/stores')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Tiendas
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
