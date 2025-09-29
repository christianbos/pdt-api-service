import { db, COLLECTIONS, cleanupFirebaseConnection } from './firebase'
import { 
  Order, 
  CreateOrderRequest, 
  OrderFilters, 
  UpdateOrderRequest,
  OrderStatus,
  canTransitionTo,
  generateInitialTimeline,
  updateTimeline,
  getValidNextStatuses
} from '@/types/order'
import { CustomerService } from './customerService'
import { StoreService } from './storeService'
import { OrderPricingService } from './orderPricing'
import { v4 as uuidv4 } from 'uuid'

export class OrderService {
  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const collection = db.collection(COLLECTIONS.ORDERS)
      
      // Validar y obtener información de entidades
      let customerName = orderData.customerName
      let storeName: string | undefined = undefined
      
      // Si hay customerId, validar que existe
      if (orderData.customerId) {
        const customer = await CustomerService.getCustomerById(orderData.customerId)
        if (!customer) {
          throw new Error(`Cliente con ID ${orderData.customerId} no encontrado`)
        }
        customerName = customer.name // Usar nombre del customer
      }
      
      // Si hay storeId, validar que existe y está activa
      if (orderData.storeId) {
        const store = await StoreService.getStoreById(orderData.storeId)
        if (!store) {
          throw new Error(`Tienda con ID ${orderData.storeId} no encontrada`)
        }
        if (store.status !== 'active') {
          throw new Error(`La tienda ${store.name} no está activa`)
        }
        storeName = store.name
      }

      // Calcular total automáticamente
      const total = OrderPricingService.calculateOrderTotal(orderData.items)

      // Generar UUID único
      const uuid = uuidv4().split('-')[0].toUpperCase() // Primeros 8 caracteres

      const orderToCreate = {
        ...orderData,
        uuid,
        customerName,
        storeName,
        total,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: generateInitialTimeline(),
        documentId: '',
        // Incluir cardIds si se proporcionan
        ...(orderData.cardIds && orderData.cardIds.length > 0 && { cardIds: orderData.cardIds })
      }

      const docRef = await collection.add(orderToCreate)
      await docRef.update({ documentId: docRef.id })

      // Si se proporcionaron cardIds, actualizar las cartas con el orderId
      if (orderData.cardIds && orderData.cardIds.length > 0) {
        console.log(`🃏 [OrderService] Updating ${orderData.cardIds.length} cards with orderId: ${docRef.id}`)

        // Actualizar cada carta con el orderId y customerId
        const batch = db.batch()
        for (const cardId of orderData.cardIds) {
          const cardRef = db.collection(COLLECTIONS.CARDS).doc(cardId)
          batch.update(cardRef, {
            orderId: docRef.id,
            customerId: orderData.customerId || customerName, // Usar customerId si existe, sino el nombre
            updatedAt: new Date().toISOString()
          })
        }

        try {
          await batch.commit()
          console.log(`✅ [OrderService] Successfully updated ${orderData.cardIds.length} cards with order reference`)
        } catch (error) {
          console.warn(`⚠️ [OrderService] Failed to update some cards with order reference:`, error)
          // No fallar la creación de la orden por esto
        }
      }

      const doc = await docRef.get()
      return doc.data() as Order
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getOrderById(documentId: string): Promise<Order | null> {
    try {
      const docRef = db.collection(COLLECTIONS.ORDERS).doc(documentId)
      const doc = await docRef.get()
      
      if (!doc.exists) return null
      
      return doc.data() as Order
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getOrders(filters: OrderFilters = {}): Promise<{
    orders: Order[]
    total: number
    hasNext: boolean
    pagination: {
      page: number
      limit: number
      total: number
    }
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        storeId,
        customerId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters

      let query = db.collection(COLLECTIONS.ORDERS)

      // Aplicar filtros
      if (status) {
        query = query.where('status', '==', status)
      }
      if (storeId) {
        query = query.where('storeId', '==', storeId)
      }
      if (customerId) {
        query = query.where('customerId', '==', customerId)
      }

      // Para búsqueda por texto, necesitamos hacer post-processing
      // ya que Firestore no soporta búsqueda de texto completa
      const countSnapshot = await query.count().get()
      const total = countSnapshot.data().count

      // Ordenamiento
      query = query.orderBy(sortBy, sortOrder)

      // Paginación
      const offset = (page - 1) * limit
      query = query.offset(offset).limit(limit)

      const snapshot = await query.get()
      let orders = snapshot.docs.map(doc => doc.data() as Order)

      // Aplicar filtro de búsqueda si existe
      if (search) {
        const searchLower = search.toLowerCase()
        orders = orders.filter(order => 
          order.customerName.toLowerCase().includes(searchLower) ||
          order.uuid.toLowerCase().includes(searchLower) ||
          order.storeName?.toLowerCase().includes(searchLower) ||
          order.documentId.toLowerCase().includes(searchLower)
        )
      }

      const hasNext = offset + orders.length < total

      return {
        orders,
        total: search ? orders.length : total, // Si hay búsqueda, el total cambia
        hasNext,
        pagination: {
          page,
          limit,
          total: search ? orders.length : total
        }
      }
    } finally {
      cleanupFirebaseConnection()
    }
  }

  // Para compatibilidad con código existente
  static async getAllOrders(limit = 20, offset = 0): Promise<{ orders: Order[], total: number }> {
    const page = Math.floor(offset / limit) + 1
    const result = await this.getOrders({ page, limit })
    return {
      orders: result.orders,
      total: result.total
    }
  }

  static async updateOrder(documentId: string, updates: UpdateOrderRequest): Promise<Order> {
    try {
      const existingOrder = await this.getOrderById(documentId)
      if (!existingOrder) {
        throw new Error(`Orden con ID ${documentId} no encontrada`)
      }

      let updateData: any = { ...updates }

      // Validar transición de estado si se está actualizando el estado
      if (updates.status && updates.status !== existingOrder.status) {
        if (!canTransitionTo(existingOrder.status, updates.status)) {
          throw new Error(
            `Transición de estado inválida: ${existingOrder.status} → ${updates.status}. ` +
            `Las transiciones válidas desde ${existingOrder.status} son: ${getValidNextStatuses(existingOrder.status).join(', ')}`
          )
        }
        
        // Actualizar timeline con la nueva transición
        updateData.timeline = updateTimeline(
          existingOrder.timeline || generateInitialTimeline(), 
          updates.status, 
          updates.performedBy
        )
      }

      // Si se actualizan los items, recalcular el total
      if (updates.items) {
        updateData.total = OrderPricingService.calculateOrderTotal(updates.items)
      }

      updateData.updatedAt = new Date().toISOString()

      const docRef = db.collection(COLLECTIONS.ORDERS).doc(documentId)
      await docRef.update(updateData)

      const updatedDoc = await docRef.get()
      return updatedDoc.data() as Order
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async deleteOrder(documentId: string): Promise<void> {
    try {
      const existingOrder = await this.getOrderById(documentId)
      if (!existingOrder) {
        throw new Error(`Orden con ID ${documentId} no encontrada`)
      }

      const docRef = db.collection(COLLECTIONS.ORDERS).doc(documentId)
      await docRef.delete()
    } finally {
      cleanupFirebaseConnection()
    }
  }

  // Assign cards to an order
  static async assignCardsToOrder(orderId: string, cardIds: string[]): Promise<Order> {
    try {
      console.log(`🃏 [OrderService] Assigning cards to order ${orderId}:`, cardIds)

      const existingOrder = await this.getOrderById(orderId)
      if (!existingOrder) {
        throw new Error(`Orden con ID ${orderId} no encontrada`)
      }

      // Merge new cardIds with existing ones (avoid duplicates)
      const currentCardIds = existingOrder.cardIds || []
      const newCardIds = [...new Set([...currentCardIds, ...cardIds])]

      await this.updateOrder(orderId, { cardIds: newCardIds })

      console.log(`✅ [OrderService] Cards assigned to order ${orderId}. Total cards: ${newCardIds.length}`)
      return await this.getOrderById(orderId) as Order
    } finally {
      cleanupFirebaseConnection()
    }
  }

  // Remove cards from an order
  static async removeCardsFromOrder(orderId: string, cardIdsToRemove: string[]): Promise<Order> {
    try {
      console.log(`🃏 [OrderService] Removing cards from order ${orderId}:`, cardIdsToRemove)

      const existingOrder = await this.getOrderById(orderId)
      if (!existingOrder) {
        throw new Error(`Orden con ID ${orderId} no encontrada`)
      }

      // Remove specified cardIds
      const currentCardIds = existingOrder.cardIds || []
      const newCardIds = currentCardIds.filter(cardId => !cardIdsToRemove.includes(cardId))

      await this.updateOrder(orderId, { cardIds: newCardIds })

      console.log(`✅ [OrderService] Cards removed from order ${orderId}. Remaining cards: ${newCardIds.length}`)
      return await this.getOrderById(orderId) as Order
    } finally {
      cleanupFirebaseConnection()
    }
  }

  // Get cards associated with an order (requires CardService)
  static async getOrderCards(orderId: string): Promise<any[]> {
    try {
      const order = await this.getOrderById(orderId)
      if (!order || !order.cardIds || order.cardIds.length === 0) {
        return []
      }

      // Import CardService here to avoid circular dependency
      const { CardService } = await import('./cardService')

      const cards = []
      for (const cardId of order.cardIds) {
        try {
          // First try to get card by documentId
          const cardDoc = await db.collection(COLLECTIONS.CARDS).doc(cardId).get()
          if (cardDoc.exists) {
            cards.push(cardDoc.data())
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch card ${cardId}:`, error)
        }
      }

      console.log(`🃏 [OrderService] Found ${cards.length} cards for order ${orderId}`)
      return cards
    } finally {
      cleanupFirebaseConnection()
    }
  }

  // Get order by UUID (for public tracking)
  static async getOrderByUuid(uuid: string): Promise<Order | null> {
    try {
      console.log(`🔍 [OrderService] Searching for order with UUID: ${uuid}`)

      const query = db.collection(COLLECTIONS.ORDERS).where('uuid', '==', uuid).limit(1)
      const snapshot = await query.get()

      if (snapshot.empty) {
        console.log(`❌ [OrderService] No order found with UUID: ${uuid}`)
        return null
      }

      const orderDoc = snapshot.docs[0]
      const order = orderDoc.data() as Order

      // Get associated cards for this order
      try {
        const cards = await this.getOrderCards(order.documentId)
        console.log(`🃏 [OrderService] Found ${cards.length} cards for order ${uuid}`)

        // Return order with cards included
        const orderWithCards = {
          ...order,
          cards
        }

        console.log(`✅ [OrderService] Found order with UUID ${uuid}: ${order.documentId} (${cards.length} cards)`)
        return orderWithCards as Order
      } catch (cardError) {
        console.warn(`⚠️ [OrderService] Could not fetch cards for order ${uuid}:`, cardError)
        // Return order without cards if there's an error
        console.log(`✅ [OrderService] Found order with UUID ${uuid}: ${order.documentId} (no cards)`)
        return order
      }
    } finally {
      cleanupFirebaseConnection()
    }
  }
}