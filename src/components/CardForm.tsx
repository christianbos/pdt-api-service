'use client'

import { useState, useEffect } from 'react'
import { CreateCardRequest } from '@/types/card'
import ImageUpload from './ImageUpload'

interface CardFormProps {
  initialData?: Partial<CreateCardRequest>
  onSubmit: (data: CreateCardRequest) => Promise<void>
  submitLabel: string
}

export default function CardForm({ initialData, onSubmit, submitLabel }: CardFormProps) {
  // Helper function to merge nested objects with defaults
  const mergeWithDefaults = (data: any, defaults: any): any => {
    if (!data) return defaults
    if (typeof data !== 'object' || typeof defaults !== 'object') return data
    
    const merged = { ...defaults }
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === 'object' && typeof defaults[key] === 'object') {
          merged[key] = mergeWithDefaults(data[key], defaults[key])
        } else {
          merged[key] = data[key]
        }
      }
    }
    return merged
  }

  // No longer need formData state - using pure HTML form

  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [showAssignment, setShowAssignment] = useState(false)

  // Cargar customers y orders al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar customers
        const customersResponse = await fetch('/api/customers?limit=100', {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' }
        })
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          setCustomers(customersData.data?.customers || [])
        }

        // Cargar órdenes pendientes (que no estén completadas)
        const ordersResponse = await fetch('/api/orders?limit=50', {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' }
        })
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          // Filtrar solo órdenes activas (no completadas ni entregadas)
          const activeOrders = ordersData.data?.orders?.filter((order: any) =>
            !['completed', 'shipped', 'delivered'].includes(order.status)
          ) || []
          setOrders(activeOrders)
        }
      } catch (error) {
        console.error('Error loading customers and orders:', error)
      }
    }

    if (showAssignment) {
      loadData()
    }
  }, [showAssignment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate next certification number automatically
      const nextCertNumber = await generateNextCertificationNumber()

      // Get form data using native FormData
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)

      // Build the data object from form fields
      const cardData = {
        name: formData.get('name') as string,
        set: formData.get('set') as string,
        number: formData.get('number') as string,
        year: formData.get('year') as string,
        rarity: formData.get('rarity') as string,
        certificationNumber: nextCertNumber,
        finalGrade: Number(formData.get('finalGrade')) || 10,
        version: Number(formData.get('version')) || 1,
        has3DScan: formData.get('has3DScan') === 'on',
        tcg: formData.get('tcg') as string || '',
        gradeText: formData.get('gradeText') as string || '',
        notes: formData.get('notes') as string || '',
        gradeDate: formData.get('gradeDate')
          ? new Date(formData.get('gradeDate') as string).toISOString()
          : new Date().toISOString(),
        customerId: formData.get('customerId') as string || '',
        orderId: formData.get('orderId') as string || '',
        surface: {
          finalScore: Number(formData.get('surface.finalScore')) || 0,
          bent: Number(formData.get('surface.bent')) || 0,
          bentWeight: 0.5,
          front: {
            color: Number(formData.get('surface.front.color')) || 0,
            scratches: Number(formData.get('surface.front.scratches')) || 0,
            colorWeight: 0.5,
            scratchesWeight: 0.5,
            totalWeight: 1.0,
          },
          back: {
            color: Number(formData.get('surface.back.color')) || 0,
            scratches: Number(formData.get('surface.back.scratches')) || 0,
            colorWeight: 0.5,
            scratchesWeight: 0.5,
            totalWeight: 1.0,
          }
        },
        edges: {
          finalScore: Number(formData.get('edges.finalScore')) || 0,
          frontWeight: 0.5,
          backWeight: 0.5,
          front: {
            left: Number(formData.get('edges.front.left')) || 0,
            top: Number(formData.get('edges.front.top')) || 0,
            right: Number(formData.get('edges.front.right')) || 0,
            bottom: Number(formData.get('edges.front.bottom')) || 0
          },
          back: {
            left: Number(formData.get('edges.back.left')) || 0,
            top: Number(formData.get('edges.back.top')) || 0,
            right: Number(formData.get('edges.back.right')) || 0,
            bottom: Number(formData.get('edges.back.bottom')) || 0
          }
        },
        corners: {
          finalScore: Number(formData.get('corners.finalScore')) || 0,
          frontWeight: 0.5,
          backWeight: 0.5,
          front: {
            topLeft: Number(formData.get('corners.front.topLeft')) || 0,
            topRight: Number(formData.get('corners.front.topRight')) || 0,
            bottomLeft: Number(formData.get('corners.front.bottomLeft')) || 0,
            bottomRight: Number(formData.get('corners.front.bottomRight')) || 0
          },
          back: {
            topLeft: Number(formData.get('corners.back.topLeft')) || 0,
            topRight: Number(formData.get('corners.back.topRight')) || 0,
            bottomLeft: Number(formData.get('corners.back.bottomLeft')) || 0,
            bottomRight: Number(formData.get('corners.back.bottomRight')) || 0
          }
        },
        centering: {
          frontScore: Number(formData.get('centering.frontScore')) || 0,
          backScore: Number(formData.get('centering.backScore')) || 0,
          finalScore: Number(formData.get('centering.finalScore')) || 0,
          front: {
            left: Number(formData.get('centering.front.left')) || 0,
            top: Number(formData.get('centering.front.top')) || 0,
            right: Number(formData.get('centering.front.right')) || 0,
            bottom: Number(formData.get('centering.front.bottom')) || 0
          },
          back: {
            left: Number(formData.get('centering.back.left')) || 0,
            top: Number(formData.get('centering.back.top')) || 0,
            right: Number(formData.get('centering.back.right')) || 0,
            bottom: Number(formData.get('centering.back.bottom')) || 0
          }
        }
      }

      await onSubmit(cardData)
    } catch (error: any) {
      console.error(`Error al crear la carta: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generateNextCertificationNumber = async (): Promise<number> => {
    try {
      // Get all cards to find the highest certification number
      const response = await fetch('/api/cards?limit=1000', {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' }
      })

      if (response.ok) {
        const data = await response.json()
        const cards = data.data?.cards || []

        // Find the highest certification number
        const maxCertNumber = cards.reduce((max: number, card: any) => {
          return card.certificationNumber > max ? card.certificationNumber : max
        }, 0)

        return maxCertNumber + 1
      } else {
        // Fallback to timestamp-based number if API fails
        return Date.now() % 1000000
      }
    } catch (error) {
      console.error('Error generating certification number:', error)
      // Fallback to timestamp-based number
      return Date.now() % 1000000
    }
  }


  // No longer need updateFormData - using pure HTML form

  return (
    <form onSubmit={handleSubmit}>
      {/* Información básica */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Información Básica</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Set *</label>
              <input
                type="text"
                name="set"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Número *</label>
              <input
                type="number"
                name="number"
                className="form-control"
                required
                min="1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Año *</label>
              <input
                type="number"
                name="year"
                className="form-control"
                required
                min="1900"
                max="2030"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Rareza *</label>
              <input
                type="text"
                name="rarity"
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Grado Final</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="finalGrade"
                defaultValue="10"
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Versión</label>
              <input
                type="number"
                min="1"
                name="version"
                defaultValue="1"
                className="form-control"
                title="Debe ser un número entero mayor a 0"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">TCG</label>
              <input
                type="text"
                name="tcg"
                className="form-control"
                placeholder="Pokemon, Yu-Gi-Oh, etc."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Texto de Grado</label>
              <input
                type="text"
                name="gradeText"
                className="form-control"
                placeholder="NEAR MINT, EXCELLENT, etc."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Fecha de Gradeo</label>
              <input
                type="datetime-local"
                name="gradeDate"
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Notas</label>
              <textarea
                name="notes"
                className="form-control"
                rows={2}
                placeholder="Notas adicionales (opcional)"
              />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  type="checkbox"
                  name="has3DScan"
                  className="form-check-input"
                  id="has3DScan"
                />
                <label className="form-check-label" htmlFor="has3DScan">Tiene escaneo 3D</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Surface */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Surface</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Score Final</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="surface.finalScore"
                className="form-control"
                title="Score final de la superficie (0-10)"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Bent</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="surface.bent"
                className="form-control"
                title="Nivel de curvatura (0-10)"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Color</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="surface.front.color"
                    className="form-control"
                    title="Rango: 0-10"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Scratches</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="surface.front.scratches"
                    className="form-control"
                    title="Rango: 0-10"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Color</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="surface.back.color"
                    className="form-control"
                    title="Rango: 0-10"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Scratches</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="surface.back.scratches"
                    className="form-control"
                    title="Rango: 0-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edges */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Edges</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Score Final</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="edges.finalScore"
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.front.left"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.front.top"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.front.right"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.front.bottom"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.back.left"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.back.top"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.back.right"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="edges.back.bottom"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corners */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Corners</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Score Final</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="corners.finalScore"
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Top Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.front.topLeft"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.front.topRight"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.front.bottomLeft"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.front.bottomRight"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Top Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.back.topLeft"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.back.topRight"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.back.bottomLeft"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="corners.back.bottomRight"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centering */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Centering</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Front Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="centering.frontScore"
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Back Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="centering.backScore"
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Final Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                name="centering.finalScore"
                className="form-control"
              />
            </div>
          </div>
          
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Front</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.front.left"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.front.top"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.front.right"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.front.bottom"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="card-subtitle mb-3">Back</h5>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Left</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.back.left"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Top</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.back.top"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Right</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.back.right"
                    className="form-control"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Bottom</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    name="centering.back.bottom"
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asignación a Cliente y Orden (Opcional) */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">Asignación (Opcional)</h3>
          <button
            type="button"
            onClick={() => setShowAssignment(!showAssignment)}
            className={`btn btn-sm ${showAssignment ? 'btn-outline-secondary' : 'btn-outline-info'}`}
          >
            {showAssignment ? 'Ocultar' : 'Mostrar'} Asignación
          </button>
        </div>

        {showAssignment && (
          <div className="card-body">
            <p className="text-muted mb-4">
              Puedes asignar esta carta directamente a un cliente o a una orden específica al crearla.
            </p>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Cliente</label>
                <select
                  name="customerId"
                  className="form-select"
                >
                  <option value="">Seleccionar cliente (opcional)</option>
                  {customers.map(customer => (
                    <option key={customer.documentId} value={customer.documentId}>
                      {customer.name} • {customer.email || 'Sin email'} • Tel: {customer.phone}
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Si asignas a un cliente, esta carta aparecerá en su historial
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label">Orden</label>
                <select
                  name="orderId"
                  className="form-select"
                >
                  <option value="">Seleccionar orden (opcional)</option>
                  {orders.map(order => (
                    <option key={order.documentId} value={order.documentId}>
                      #{order.uuid} - {order.customerName} ({order.status})
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Selecciona una orden para asignar la carta
                </div>
              </div>
            </div>

            <div className="alert alert-info mt-3">
              <small>
                <strong>Nota:</strong> La asignación de cliente y orden es opcional. Puedes dejar estos campos vacíos.
              </small>
            </div>
          </div>
        )}
      </div>


      {/* Submit Button */}
      <div className="d-flex justify-content-end">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-gradient"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Procesando...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}