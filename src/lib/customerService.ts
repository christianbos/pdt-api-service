import { db, COLLECTIONS, cleanupFirebaseConnection } from './firebase'
import { Customer, CreateCustomerRequest } from '@/types/customer'
import { Order } from '@/types/order'

export class CustomerService {
  static async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      const collection = db.collection(COLLECTIONS.CUSTOMERS)
      
      const docRef = await collection.add({
        ...customerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentId: '',
      })

      await docRef.update({ documentId: docRef.id })

      const doc = await docRef.get()
      return doc.data() as Customer
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getCustomerById(documentId: string): Promise<Customer | null> {
    try {
      const docRef = db.collection(COLLECTIONS.CUSTOMERS).doc(documentId)
      const doc = await docRef.get()
      
      if (!doc.exists) return null
      
      return doc.data() as Customer
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getAllCustomers(limit = 20, offset = 0): Promise<{ customers: Customer[], total: number }> {
    try {
      const collection = db.collection(COLLECTIONS.CUSTOMERS)
      
      const countSnapshot = await collection.count().get()
      const total = countSnapshot.data().count

      const snapshot = await collection
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get()

      const customers = snapshot.docs.map(doc => doc.data() as Customer)

      return { customers, total }
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async updateCustomer(documentId: string, updates: Partial<CreateCustomerRequest>): Promise<Customer> {
    try {
      const existingCustomer = await this.getCustomerById(documentId)
      if (!existingCustomer) {
        throw new Error(`Customer with ID ${documentId} not found`)
      }

      const docRef = db.collection(COLLECTIONS.CUSTOMERS).doc(documentId)
      await docRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })

      const updatedDoc = await docRef.get()
      return updatedDoc.data() as Customer
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async deleteCustomer(documentId: string): Promise<void> {
    try {
      const existingCustomer = await this.getCustomerById(documentId)
      if (!existingCustomer) {
        throw new Error(`Customer with ID ${documentId} not found`)
      }

      const docRef = db.collection(COLLECTIONS.CUSTOMERS).doc(documentId)
      await docRef.delete()
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getCustomerOrderHistory(customerId: string): Promise<any[]> {
    try {
      console.log(`👤 [CustomerService] Fetching order history for customer: ${customerId}`)

      // Query orders directly from Firestore to avoid index issues
      const collection = db.collection(COLLECTIONS.ORDERS)

      // Simple query by customerId only, then sort in memory
      const snapshot = await collection
        .where('customerId', '==', customerId)
        .limit(100) // Limit to avoid large datasets
        .get()

      console.log(`📊 [CustomerService] Found ${snapshot.docs.length} orders for customer`)

      // Get orders and sort in memory to avoid composite index requirement
      let orders = snapshot.docs.map(doc => doc.data())

      // Sort by createdAt in descending order (most recent first)
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const ordersWithCards: any[] = []

      // Import OrderService to avoid circular dependency
      const { OrderService } = await import('./orderService')

      // For each order, get associated cards
      for (const order of orders) {
        try {
          // Get cards for this order using the existing method
          const cards = await OrderService.getOrderCards(order.documentId)

          ordersWithCards.push({
            ...order,
            cards // Add cards array to the order
          })

          console.log(`🃏 [CustomerService] Order ${order.uuid} has ${cards.length} cards`)
        } catch (error) {
          console.warn(`⚠️ [CustomerService] Could not fetch cards for order ${order.uuid}:`, error)
          // Still include the order, just without cards
          ordersWithCards.push({
            ...order,
            cards: []
          })
        }
      }

      console.log(`✅ [CustomerService] Found ${ordersWithCards.length} orders with cards for customer ${customerId}`)

      // Debug: Log the UUIDs we're returning
      console.log(`📋 [CustomerService] UUIDs being returned:`, ordersWithCards.map(order => ({
        documentId: order.documentId,
        uuid: order.uuid,
        customerName: order.customerName
      })))

      return ordersWithCards

    } finally {
      cleanupFirebaseConnection()
    }
  }
}