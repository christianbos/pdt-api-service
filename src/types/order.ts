import { z } from 'zod'

export type OrderStatus = 
  | 'pending'       // Orden creada, esperando cartas
  | 'received'      // Cartas recibidas en PDT
  | 'processing'    // En proceso de gradeo
  | 'encapsulated'  // Cartas encapsuladas
  | 'completed'     // Gradeo completado
  | 'shipped'       // Enviado de regreso
  | 'delivered'     // Entregado al cliente
export type ProductType = 'grading' | 'mysterypack'

export interface OrderItem {
  productType: ProductType
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderStatusEntry {
  step: number
  status: 'completed' | 'current' | 'pending'
  title: string
  description: string
  date?: string                 // ISO string para estados completados
  estimatedDate?: string        // ISO string para estados pendientes
  performedBy?: string          // Empleado que completó el paso
}

export interface Order {
  documentId: string
  uuid: string              // UUID único para mostrar al usuario
  customerId?: string       // Referencia a Customer entity
  customerName: string      // Cacheado para evitar joins
  storeId?: string          // Referencia a Store entity (opcional para clientes directos)
  storeName?: string        // Cacheado para evitar joins
  items: OrderItem[]        // Array de productos con cantidades
  cardIds?: string[]        // Array de IDs de cartas asociadas a esta orden
  status: OrderStatus
  total: number            // Calculado automáticamente
  createdAt: string
  updatedAt: string
  timeline: OrderStatusEntry[]  // Timeline del proceso
  assignedTo?: string           // Empleado asignado
  estimatedDelivery?: string    // ISO string
}

export interface CreateOrderRequest {
  customerId?: string       // Referencia opcional a Customer
  customerName: string      // Requerido siempre
  storeId?: string          // Opcional para clientes directos
  items: OrderItem[]        // Productos a incluir
  cardIds?: string[]        // Array opcional de IDs de cartas a asignar
}

export const CreateOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'El nombre del cliente es requerido'),
  storeId: z.string().optional(),
  items: z.array(z.object({
    productType: z.enum(['grading', 'mysterypack']),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
    subtotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0')
  })).min(1, 'Debe haber al menos un producto'),
  cardIds: z.array(z.string()).optional()
})

export const UpdateOrderSchema = z.object({
  customerName: z.string().min(1, 'El nombre del cliente es requerido').optional(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  status: z.enum(['pending', 'received', 'processing', 'encapsulated', 'completed', 'shipped', 'delivered']).optional(),
  items: z.array(z.object({
    productType: z.enum(['grading', 'mysterypack']),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
    subtotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0')
  })).optional(),
  assignedTo: z.string().optional(),
  estimatedDelivery: z.string().optional()
})

export interface UpdateOrderRequest {
  customerName?: string
  storeId?: string
  storeName?: string
  status?: OrderStatus
  items?: OrderItem[]
  cardIds?: string[]    // Para asignar/desasignar cartas
  assignedTo?: string
  estimatedDelivery?: string
  performedBy?: string  // Para el timeline
}

export interface OrderFilters {
  page?: number
  limit?: number
  status?: OrderStatus
  storeId?: string
  customerId?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'customerName'
  sortOrder?: 'asc' | 'desc'
}

// Precios para clientes directos
export const CLIENT_PRICING = {
  grading: 350,
  mysterypack: 150
}

// Estado machine para órdenes
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['received'],
  received: ['processing'],
  processing: ['encapsulated'],
  encapsulated: ['completed'],
  completed: ['shipped'],
  shipped: ['delivered'],
  delivered: [] // Estado final
}

// Metadata de estados
export const ORDER_STATUS_METADATA: Record<OrderStatus, {
  step: number
  title: string
  description: string
  estimatedDays: number
}> = {
  pending: {
    step: 1,
    title: 'Orden Creada',
    description: 'Esperando que las cartas lleguen a nuestras instalaciones',
    estimatedDays: 0
  },
  received: {
    step: 2,
    title: 'Cartas Recibidas',
    description: 'Las cartas han llegado y están siendo catalogadas',
    estimatedDays: 1
  },
  processing: {
    step: 3,
    title: 'En Proceso de Gradeo',
    description: 'Las cartas están siendo evaluadas por nuestros expertos',
    estimatedDays: 7
  },
  encapsulated: {
    step: 4,
    title: 'Cartas Encapsuladas',
    description: 'Las cartas han sido encapsuladas con su calificación',
    estimatedDays: 10
  },
  completed: {
    step: 5,
    title: 'Gradeo Completado',
    description: 'El proceso de gradeo ha sido completado exitosamente',
    estimatedDays: 12
  },
  shipped: {
    step: 6,
    title: 'Enviado',
    description: 'Las cartas han sido enviadas de regreso',
    estimatedDays: 14
  },
  delivered: {
    step: 7,
    title: 'Entregado',
    description: 'Las cartas han sido entregadas al cliente',
    estimatedDays: 16
  }
}

// Función para validar transición de estado
export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus)
}

// Función para obtener próximos estados válidos
export function getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus]
}

// Función para generar timeline inicial
export function generateInitialTimeline(): OrderStatusEntry[] {
  const allStatuses: OrderStatus[] = ['pending', 'received', 'processing', 'encapsulated', 'completed', 'shipped', 'delivered']
  
  return allStatuses.map((status, index) => {
    const metadata = ORDER_STATUS_METADATA[status]
    return {
      step: metadata.step,
      status: index === 0 ? 'current' : 'pending',
      title: metadata.title,
      description: metadata.description,
      date: index === 0 ? new Date().toISOString() : undefined,
      estimatedDate: index > 0 ? 
        new Date(Date.now() + metadata.estimatedDays * 24 * 60 * 60 * 1000).toISOString() : 
        undefined
    }
  })
}

// Función para actualizar timeline cuando cambia el estado
export function updateTimeline(
  currentTimeline: OrderStatusEntry[], 
  newStatus: OrderStatus, 
  performedBy?: string
): OrderStatusEntry[] {
  const newTimeline = [...currentTimeline]
  const statusMetadata = ORDER_STATUS_METADATA[newStatus]
  
  // Marcar el estado actual como completado
  const currentIndex = newTimeline.findIndex(entry => entry.status === 'current')
  if (currentIndex !== -1) {
    newTimeline[currentIndex] = {
      ...newTimeline[currentIndex],
      status: 'completed',
      date: new Date().toISOString(),
      performedBy
    }
  }
  
  // Marcar el nuevo estado como actual
  const newIndex = newTimeline.findIndex(entry => entry.step === statusMetadata.step)
  if (newIndex !== -1) {
    newTimeline[newIndex] = {
      ...newTimeline[newIndex],
      status: 'current',
      date: new Date().toISOString(),
      performedBy
    }
  }
  
  return newTimeline
}

export const BulkUpdateOrderSchema = z.object({
  orderIds: z.array(z.string()).min(1, 'At least one order ID is required'),
  status: z.enum(['pending', 'received', 'processing', 'encapsulated', 'completed', 'shipped', 'delivered']).optional(),
  assignedTo: z.string().optional(),
  performedBy: z.string().optional()
})

