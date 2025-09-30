import { db, COLLECTIONS, cleanupFirebaseConnection } from './firebase'
import { OrderService } from './orderService'
import { CustomerService } from './customerService'
import { StoreService } from './storeService'
import { Order } from '@/types/order'

export interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  totalRevenue: number
  activeStores: number
  avgProcessingTime: number // días
  monthlyGrowth: number    // porcentaje
}

export interface AdminStats extends DashboardStats {
  totalCustomers: number
  newCustomersThisMonth: number
  topStores: Array<{
    storeId: string
    storeName: string
    totalOrders: number
    totalRevenue: number
  }>
  ordersByStatus: Record<string, number>
  revenueByMonth: Array<{
    month: string
    revenue: number
    orders: number
  }>
}

export class AnalyticsService {
  /**
   * Obtener estadísticas para el dashboard
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [orders, storeData] = await Promise.all([
        this.getAllOrders(),
        StoreService.getAllStores(100, 0), // Get all stores instead of getStoreStats
      ])

      const storeStats = { stores: storeData.stores, total: storeData.total }

      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      // Calcular estadísticas básicas
      const totalOrders = orders.length
      const pendingOrders = orders.filter(o => ['pending', 'received'].includes(o.status)).length
      const processingOrders = orders.filter(o => o.status === 'processing').length
      const completedOrders = orders.filter(o => ['completed', 'shipped', 'delivered'].includes(o.status)).length
      
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

      // Calcular tiempo promedio de procesamiento
      const completedOrdersWithDates = orders.filter(o => 
        o.status === 'completed' && 
        o.createdAt && 
        o.timeline.find(t => t.status === 'completed' && t.date)
      )

      let avgProcessingTime = 12 // default
      if (completedOrdersWithDates.length > 0) {
        const processingTimes = completedOrdersWithDates.map(order => {
          const createdDate = new Date(order.createdAt)
          const completedEntry = order.timeline.find(t => t.status === 'completed' && t.date)
          if (!completedEntry?.date) return 12
          
          const completedDate = new Date(completedEntry.date)
          return Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        })

        avgProcessingTime = Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
      }

      // Calcular crecimiento mensual
      const currentMonthOrders = orders.filter(o => new Date(o.createdAt) >= currentMonth).length
      const lastMonthOrders = orders.filter(o => {
        const createdDate = new Date(o.createdAt)
        return createdDate >= lastMonth && createdDate < currentMonth
      }).length

      const monthlyGrowth = lastMonthOrders > 0 
        ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
        : 0

      return {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeStores: storeStats.stores.filter(store => store.status === 'active').length,
        avgProcessingTime,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      }
    } finally {
      cleanupFirebaseConnection()
    }
  }

  /**
   * Obtener estadísticas administrativas avanzadas
   */
  static async getAdminStats(params: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    storeId?: string
  }): Promise<AdminStats> {
    try {
      const { period = 'month', storeId } = params

      const [orders, customerData, storeData] = await Promise.all([
        this.getAllOrders(storeId),
        CustomerService.getAllCustomers(100, 0),
        StoreService.getAllStores(100, 0),
      ])

      const customerStats = { customers: customerData.customers, total: customerData.total }
      const storeStats = { stores: storeData.stores, total: storeData.total }

      // Obtener estadísticas básicas del dashboard
      const dashboardStats = await this.getDashboardStats()

      // Calcular top tiendas
      const topStores = await this.getTopStores(orders, 5)

      // Calcular órdenes por estado
      const ordersByStatus = this.calculateOrdersByStatus(orders)

      // Calcular ingresos por mes
      const revenueByMonth = this.calculateRevenueByMonth(orders, period)

      return {
        ...dashboardStats,
        totalCustomers: customerStats.total,
        newCustomersThisMonth: 0, // Would need to calculate from customerStats.customers
        topStores,
        ordersByStatus,
        revenueByMonth,
      }
    } finally {
      cleanupFirebaseConnection()
    }
  }

  /**
   * Obtener todas las órdenes (helper interno)
   */
  private static async getAllOrders(storeId?: string): Promise<Order[]> {
    let query = db.collection(COLLECTIONS.ORDERS) as any

    if (storeId) {
      query = query.where('storeId', '==', storeId)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[]
  }

  /**
   * Calcular top tiendas por ingresos
   */
  private static async getTopStores(orders: Order[], limit: number = 5): Promise<Array<{
    storeId: string
    storeName: string
    totalOrders: number
    totalRevenue: number
  }>> {
    const storeStats = new Map<string, { 
      storeId: string
      storeName: string
      totalOrders: number
      totalRevenue: number 
    }>()

    orders.forEach(order => {
      if (!order.storeId) return // Skip orders without store
      const existing = storeStats.get(order.storeId) || {
        storeId: order.storeId,
        storeName: order.storeName || 'Unknown Store',
        totalOrders: 0,
        totalRevenue: 0,
      }

      existing.totalOrders++
      existing.totalRevenue += order.total

      storeStats.set(order.storeId, existing)
    })

    return Array.from(storeStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
      .map(store => ({
        ...store,
        totalRevenue: Math.round(store.totalRevenue * 100) / 100,
      }))
  }

  /**
   * Calcular distribución de órdenes por estado
   */
  private static calculateOrdersByStatus(orders: Order[]): Record<string, number> {
    const statusCount: Record<string, number> = {}

    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1
    })

    return statusCount
  }

  /**
   * Calcular ingresos por mes
   */
  private static calculateRevenueByMonth(
    orders: Order[], 
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Array<{ month: string; revenue: number; orders: number }> {
    const now = new Date()
    const periods: Array<{ month: string; revenue: number; orders: number }> = []

    // Determinar número de períodos a incluir
    const periodCount = period === 'week' ? 8 : period === 'month' ? 12 : period === 'quarter' ? 4 : 2

    for (let i = periodCount - 1; i >= 0; i--) {
      let startDate: Date
      let endDate: Date
      let label: string

      if (period === 'week') {
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - (i * 7))
        startDate.setHours(0, 0, 0, 0)
        
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)

        label = `Sem ${periodCount - i}`
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
        label = startDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
      } else if (period === 'quarter') {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3 - (i * 3)
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59, 999)
        label = `Q${Math.floor(quarterStart / 3) + 1} ${startDate.getFullYear()}`
      } else { // year
        startDate = new Date(now.getFullYear() - i, 0, 1)
        endDate = new Date(now.getFullYear() - i, 11, 31, 23, 59, 59, 999)
        label = startDate.getFullYear().toString()
      }

      const periodOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate && orderDate <= endDate
      })

      const revenue = periodOrders.reduce((sum, order) => sum + order.total, 0)

      periods.push({
        month: label,
        revenue: Math.round(revenue * 100) / 100,
        orders: periodOrders.length,
      })
    }

    return periods
  }
}