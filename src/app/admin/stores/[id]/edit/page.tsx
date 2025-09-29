'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StoreForm from '@/components/StoreForm'
import { Store, UpdateStoreRequest } from '@/types/store'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditStorePage({ params }: PageProps) {
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

  const handleSubmit = async (data: UpdateStoreRequest) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('Tienda actualizada exitosamente')
        router.push('/admin/stores')
      } else {
        const error = await response.json()
        alert('Error al actualizar la tienda: ' + error.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la tienda')
    }
  }

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
          <div className="gradient-bg text-white rounded p-2 me-3">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="h3 mb-0 fw-bold">
              Editar Tienda #{store.id}
            </h1>
            <small className="text-muted">
              Modifica la información de la tienda: {store.name}
            </small>
          </div>
        </div>
      </div>

      <StoreForm
        initialData={store}
        onSubmit={handleSubmit}
        submitLabel="Actualizar Tienda"
      />
    </div>
  )
}
