import { z } from 'zod'

export interface Customer {
  id?: string
  documentId: string
  name: string
  phone: string
  email?: string
  totalOrders?: number
  totalSpent?: number
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerRequest {
  name: string
  phone: string
  email?: string
}

export interface UpdateCustomerRequest {
  name?: string
  phone?: string
  email?: string
}

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z.string().min(1, 'El teléfono es requerido').max(20, 'El teléfono no puede exceder 20 caracteres'),
  email: z.string().email('Email inválido').optional()
})

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z.string().min(1, 'El teléfono es requerido').max(20, 'El teléfono no puede exceder 20 caracteres'),
  email: z.string().optional()
})

export const CustomerSearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().positive().optional()
})

