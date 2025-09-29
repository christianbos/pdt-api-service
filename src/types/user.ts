import { z } from 'zod'

export type UserRole = 'admin' | 'store_owner' | 'customer'

export interface UserProfile {
  uid: string              // Firebase Auth UID
  email: string
  name: string
  role: UserRole
  
  // Para store owners
  storeId?: string         // ID de la tienda que posee
  
  // Para customers
  customerId?: string      // ID del customer profile
  
  // Metadata
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface CreateUserProfileRequest {
  uid: string
  email: string
  name: string
  role: UserRole
  storeId?: string
  customerId?: string
}

export interface AuthMeResponse {
  user: {
    uid: string
    email: string
    name: string
    role: UserRole
    isActive: boolean
    customerId?: string
    storeId?: string
  }

  // Solo se incluye si role === 'store_owner'
  store?: {
    documentId: string
    name: string
    email: string
    phone?: string
    address?: string
    logoUrl?: string
    status: 'active' | 'inactive'
    gradingPrice: number
    mysteryPackPrice: number
    createdAt: string
    updatedAt: string
  }

  // Solo se incluye si role === 'customer'
  customer?: {
    documentId: string
    name: string
    phone: string
    email?: string
    totalOrders?: number
    totalSpent?: number
    createdAt: string
    updatedAt: string
  }

  // Indica si el cliente necesita refrescar el token para obtener custom claims
  needsTokenRefresh?: boolean
}

export const CreateUserProfileSchema = z.object({
  uid: z.string().min(1, 'UID es requerido'),
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  role: z.enum(['admin', 'store_owner', 'customer'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser admin, store_owner o customer' })
  }),
  storeId: z.string().optional(),
  customerId: z.string().optional()
})

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres').optional(),
  role: z.enum(['admin', 'store_owner', 'customer'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser admin, store_owner o customer' })
  }).optional(),
  storeId: z.string().optional(),
  customerId: z.string().optional(),
  isActive: z.boolean().optional()
})