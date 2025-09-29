'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrderStatus, ORDER_STATUS_METADATA } from '@/types/order'
import { StatusBadge } from './StatusBadge'

interface StatusOption {
  value: OrderStatus
  label: string
  description: string
}

interface StatusDropdownProps {
  orderId: string
  currentStatus: OrderStatus
  onStatusChange: (newStatus: OrderStatus) => void
  disabled?: boolean
}

export function StatusDropdown({ 
  orderId, 
  currentStatus, 
  onStatusChange,
  disabled = false 
}: StatusDropdownProps) {
  const [validStatuses, setValidStatuses] = useState<StatusOption[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchValidStatuses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}/status`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setValidStatuses(data.data.validNextStatuses || [])
      } else {
        console.error('Error fetching valid statuses')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchValidStatuses()
  }, [orderId, currentStatus, fetchValidStatuses])

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus || updating) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify({
          status: newStatus,
          performedBy: 'admin'
        })
      })

      if (response.ok) {
        const data = await response.json()
        onStatusChange(newStatus)
        // Mostrar mensaje de éxito
        if (data.data.message) {
          // Podrías usar un toast aquí
          console.log('Status updated:', data.data.message)
        }
      } else {
        const errorData = await response.json()
        alert(`Error al actualizar estado: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    } finally {
      setUpdating(false)
    }
  }

  if (disabled) {
    return <StatusBadge status={currentStatus} size="sm" />
  }

  return (
    <div className="dropdown">
      <button
        className="btn btn-link p-0 text-decoration-none"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        disabled={loading || updating}
        style={{ border: 'none', background: 'none' }}
      >
        <StatusBadge status={currentStatus} size="sm" />
        {(loading || updating) ? (
          <div className="spinner-border spinner-border-sm ms-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : (
          <svg width="12" height="12" fill="currentColor" className="ms-1" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
        )}
      </button>
      
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <div className="dropdown-header">Estado actual</div>
        </li>
        <li>
          <span className="dropdown-item-text">
            <StatusBadge status={currentStatus} size="sm" />
            <small className="text-muted d-block">
              {ORDER_STATUS_METADATA[currentStatus].description}
            </small>
          </span>
        </li>
        
        {validStatuses.length > 0 && (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <div className="dropdown-header">Cambiar a</div>
            </li>
            {validStatuses.map((status) => (
              <li key={status.value}>
                <button
                  className="dropdown-item"
                  onClick={() => handleStatusChange(status.value)}
                  disabled={updating}
                >
                  <StatusBadge status={status.value} size="sm" />
                  <small className="text-muted d-block">
                    {status.description}
                  </small>
                </button>
              </li>
            ))}
          </>
        )}
        
        {validStatuses.length === 0 && !loading && (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <span className="dropdown-item-text text-muted small">
                No hay transiciones disponibles
              </span>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}