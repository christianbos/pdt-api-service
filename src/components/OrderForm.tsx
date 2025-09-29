'use client'

import { useState, useEffect } from 'react'
import { CreateOrderRequest, Order, OrderItem, ProductType, OrderStatus, UpdateOrderRequest } from '@/types/order'
import { Store } from '@/types/store'
import { Customer } from '@/types/customer'
import { OrderPricingService } from '@/lib/orderPricing'
import { StatusDropdown } from './admin/StatusDropdown'

interface OrderFormProps {
  initialData?: Partial<Order>
  onSubmit: (data: CreateOrderRequest | UpdateOrderRequest) => Promise<void>
  submitLabel: string
  isEditing?: boolean
}

export default function OrderForm({ initialData, onSubmit, submitLabel, isEditing = false }: OrderFormProps) {
  const [formData, setFormData] = useState<CreateOrderRequest & { status?: OrderStatus, assignedTo?: string }>({
    customerId: initialData?.customerId || '',
    customerName: initialData?.customerName || '',
    storeId: initialData?.storeId || '',
    items: initialData?.items || [],
    cardIds: initialData?.cardIds || [],
    status: initialData?.status,
    assignedTo: initialData?.assignedTo || '',
  })
  
  const [stores, setStores] = useState<Store[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  // Estados para gestión de cartas
  const [availableCards, setAvailableCards] = useState<any[]>([])
  const [selectedCards, setSelectedCards] = useState<any[]>([])
  const [cardSearch, setCardSearch] = useState('')
  const [loadingCards, setLoadingCards] = useState(false)
  const [showCardSection, setShowCardSection] = useState(false)

  // Fetch stores and customers
  useEffect(() => {
    Promise.all([
      fetch('/api/stores', {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' }
      }).then(res => res.json()),
      fetch('/api/customers', {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' }
      }).then(res => res.json())
    ]).then(([storesData, customersData]) => {
      setStores(storesData.data?.stores || [])
      setCustomers(customersData.data?.customers || [])
    }).catch(console.error)
  }, [])

  // Update selected store when storeId changes
  useEffect(() => {
    const store = stores.find(s => s.documentId === formData.storeId)
    setSelectedStore(store || null)
  }, [formData.storeId, stores])

  // Función para buscar cartas disponibles
  const searchAvailableCards = async (query: string = '') => {
    if (!formData.customerId && !query) return // Necesitamos al menos un customer o una búsqueda

    setLoadingCards(true)
    try {
      let url = '/api/cards?limit=20'
      if (query) {
        url += `&search=${encodeURIComponent(query)}`
      }

      const response = await fetch(url, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' }
      })

      if (response.ok) {
        const data = await response.json()
        // Filtrar cartas que no tengan orderId (están disponibles)
        const available = data.data?.cards?.filter((card: any) => !card.orderId) || []

        // Si hay customer seleccionado, priorizar sus cartas
        if (formData.customerId) {
          const customerCards = available.filter((card: any) => card.customerId === formData.customerId)
          const otherCards = available.filter((card: any) => card.customerId !== formData.customerId)
          setAvailableCards([...customerCards, ...otherCards])
        } else {
          setAvailableCards(available)
        }
      }
    } catch (error) {
      console.error('Error searching cards:', error)
    } finally {
      setLoadingCards(false)
    }
  }

  // Cargar cartas cuando se selecciona un customer o se abre la sección
  useEffect(() => {
    if (showCardSection && formData.customerId) {
      searchAvailableCards()
    }
  }, [showCardSection, formData.customerId])

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value
    const customer = customers.find(c => c.documentId === customerId)

    setFormData({
      ...formData,
      customerId: customerId || undefined,
      customerName: customer?.name || '',
      cardIds: [] // Limpiar cartas seleccionadas al cambiar customer
    })

    // Limpiar selección de cartas
    setSelectedCards([])
  }

  // Funciones para manejar cartas
  const addCardToOrder = (card: any) => {
    const newSelectedCards = [...selectedCards, card]
    setSelectedCards(newSelectedCards)
    setFormData({
      ...formData,
      cardIds: newSelectedCards.map(c => c.documentId)
    })

    // Remover de cartas disponibles
    setAvailableCards(availableCards.filter(c => c.documentId !== card.documentId))
  }

  const removeCardFromOrder = (card: any) => {
    const newSelectedCards = selectedCards.filter(c => c.documentId !== card.documentId)
    setSelectedCards(newSelectedCards)
    setFormData({
      ...formData,
      cardIds: newSelectedCards.map(c => c.documentId)
    })

    // Agregar de vuelta a cartas disponibles
    setAvailableCards([...availableCards, card])
  }

  const addProduct = (productType: ProductType) => {
    try {
      const orderItem = OrderPricingService.createOrderItem(productType, 1, selectedStore || undefined)
      
      // Validar que el item se creó correctamente
      if (!orderItem || typeof orderItem.unitPrice !== 'number' || typeof orderItem.subtotal !== 'number') {
        console.error('Error creating order item:', orderItem)
        alert('Error al agregar el producto. Por favor intenta de nuevo.')
        return
      }
      
      setFormData({
        ...formData,
        items: [...formData.items, orderItem]
      })
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Error al agregar el producto. Por favor intenta de nuevo.')
    }
  }

  const updateProductQuantity = (index: number, quantity: number) => {
    try {
      const newItems = [...formData.items]
      const item = newItems[index]
      
      // Recalcular precio
      const unitPrice = OrderPricingService.getProductPrice(item.productType, selectedStore || undefined)
      const validQuantity = Math.max(1, quantity)
      
      // Validar que el precio es válido
      if (typeof unitPrice !== 'number' || isNaN(unitPrice)) {
        console.error('Invalid unit price:', unitPrice)
        return
      }
      
      newItems[index] = {
        ...item,
        quantity: validQuantity,
        unitPrice,
        subtotal: unitPrice * validQuantity
      }
      
      setFormData({ ...formData, items: newItems })
    } catch (error) {
      console.error('Error updating product quantity:', error)
    }
  }

  const removeProduct = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const calculateTotal = () => {
    try {
      // Filtrar items válidos antes de calcular
      const validItems = formData.items.filter(item => 
        item && typeof item.subtotal === 'number' && !isNaN(item.subtotal)
      )
      return OrderPricingService.calculateOrderTotal(validItems)
    } catch (error) {
      console.error('Error calculating total:', error)
      return 0
    }
  }

  const getProductDisplayName = (productType: ProductType) => {
    return productType === 'grading' ? 'Grading Service' : 'Mystery Pack'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.items.length === 0) {
      alert('Debes agregar al menos un producto')
      return
    }
    
    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al crear la orden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Información del Cliente */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Información del Cliente</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Cliente Existente</label>
              <select 
                value={formData.customerId || ''} 
                onChange={handleCustomerChange}
                className="form-select"
              >
                <option value="">Nuevo cliente (manual)</option>
                {customers.map(customer => (
                  <option key={customer.documentId} value={customer.documentId}>
                    {customer.name} • {customer.email || 'Sin email'} • Tel: {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Nombre del Cliente *</label>
              <input 
                type="text" 
                value={formData.customerName} 
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} 
                className="form-control" 
                required 
                placeholder={formData.customerId ? "Se llenará automáticamente" : "Ingrese nombre del cliente"}
                disabled={!!formData.customerId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Información de la Tienda */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Información de la Tienda</h3>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label">Tienda (Opcional - dejar vacío para cliente directo)</label>
              <select 
                value={formData.storeId || ''} 
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value || undefined })}
                className="form-select"
              >
                <option value="">Cliente directo (precios públicos)</option>
                {stores.map(store => (
                  <option key={store.documentId} value={store.documentId}>
                    {store.name} (Grading: ${store.gradingPrice}, Mystery: ${store.mysteryPackPrice})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Estado y Asignación (solo en modo edición) */}
      {isEditing && (
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title mb-0">Estado y Asignación</h3>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Estado de la Orden</label>
                {formData.status && initialData?.documentId ? (
                  <StatusDropdown
                    orderId={initialData.documentId}
                    currentStatus={formData.status}
                    onStatusChange={(newStatus) => setFormData({ ...formData, status: newStatus })}
                  />
                ) : (
                  <div className="text-muted">Estado no disponible</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Asignado a (Empleado)</label>
                <input 
                  type="text" 
                  value={formData.assignedTo || ''} 
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="form-control" 
                  placeholder="Email o nombre del empleado"
                />
                <div className="form-text">
                  Empleado responsable de procesar esta orden
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Productos */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">Productos</h3>
          <div className="btn-group btn-group-sm">
            <button 
              type="button" 
              onClick={() => addProduct('grading')}
              className="btn btn-outline-success"
            >
              + Grading
            </button>
            <button 
              type="button" 
              onClick={() => addProduct('mysterypack')}
              className="btn btn-outline-info"
            >
              + Mystery Pack
            </button>
          </div>
        </div>
        <div className="card-body">
          {formData.items.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p>No hay productos agregados</p>
              <p className="small">Usa los botones de arriba para agregar productos</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{getProductDisplayName(item.productType)}</td>
                      <td>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                          className="form-control form-control-sm"
                          min="1"
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>${(item.unitPrice || 0).toFixed(0)}</td>
                      <td><strong>${(item.subtotal || 0).toFixed(0)}</strong></td>
                      <td>
                        <button 
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-info">
                    <td colSpan={3}><strong>Total</strong></td>
                    <td><strong>${calculateTotal().toFixed(0)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Cartas (Opcional) */}
      {!isEditing && (
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="card-title mb-0">Cartas a Incluir (Opcional)</h3>
            <button
              type="button"
              onClick={() => setShowCardSection(!showCardSection)}
              className={`btn btn-sm ${showCardSection ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
            >
              {showCardSection ? 'Ocultar' : 'Mostrar'} Cartas
            </button>
          </div>

          {showCardSection && (
            <div className="card-body">
              {/* Búsqueda de cartas */}
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <input
                    type="text"
                    value={cardSearch}
                    onChange={(e) => setCardSearch(e.target.value)}
                    className="form-control"
                    placeholder="Buscar cartas por nombre o número de certificación..."
                  />
                </div>
                <div className="col-md-4">
                  <button
                    type="button"
                    onClick={() => searchAvailableCards(cardSearch)}
                    className="btn btn-outline-primary"
                    disabled={loadingCards}
                  >
                    {loadingCards ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {/* Cartas seleccionadas */}
              {selectedCards.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-success">Cartas Seleccionadas ({selectedCards.length})</h5>
                  <div className="row g-2">
                    {selectedCards.map((card) => (
                      <div key={card.documentId} className="col-md-6">
                        <div className="card bg-light border-success">
                          <div className="card-body p-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{card.name}</strong>
                                <br />
                                <small className="text-muted">
                                  #{card.certificationNumber} • Grado {card.finalGrade}
                                </small>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCardFromOrder(card)}
                                className="btn btn-sm btn-outline-danger"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cartas disponibles */}
              {availableCards.length > 0 ? (
                <div>
                  <h6 className="text-muted">Cartas Disponibles</h6>
                  <div className="row g-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {availableCards.map((card) => (
                      <div key={card.documentId} className="col-md-6">
                        <div className="card bg-white border">
                          <div className="card-body p-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{card.name}</strong>
                                <br />
                                <small className="text-muted">
                                  #{card.certificationNumber} • Grado {card.finalGrade}
                                  {card.customerId === formData.customerId && (
                                    <span className="badge bg-primary ms-1">Propia</span>
                                  )}
                                </small>
                              </div>
                              <button
                                type="button"
                                onClick={() => addCardToOrder(card)}
                                className="btn btn-sm btn-outline-success"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !loadingCards && showCardSection && (
                  <div className="text-center text-muted py-3">
                    <p>No hay cartas disponibles</p>
                    <p className="small">
                      {formData.customerId
                        ? 'Intenta buscar cartas específicas o todas las cartas están ya asignadas a otras órdenes.'
                        : 'Selecciona un cliente primero para ver sus cartas disponibles.'
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="d-flex justify-content-end">
        <button type="submit" disabled={loading} className="btn btn-gradient">
          {loading ? 'Procesando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}