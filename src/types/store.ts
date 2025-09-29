import { z } from 'zod'

export interface Store {
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

export interface CreateStoreRequest {
  name: string
  email: string
  phone?: string
  address?: string
  logoUrl?: string
  gradingPrice: number
  mysteryPackPrice: number
}

export interface UpdateStoreRequest {
  name?: string
  email?: string
  phone?: string
  address?: string
  logoUrl?: string
  gradingPrice?: number
  mysteryPackPrice?: number
}

// Precios por defecto para nuevas tiendas
export const DEFAULT_STORE_PRICING = {
  gradingPrice: 280,
  mysteryPackPrice: 120
}

export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional(),
  gradingPrice: z.number().min(100, 'El precio mínimo es 100 MXN').max(500, 'El precio máximo es 500 MXN'),
  mysteryPackPrice: z.number().min(50, 'El precio mínimo es 50 MXN').max(300, 'El precio máximo es 300 MXN')
})

export const UpdateStoreSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional(),
  gradingPrice: z.number().min(100, 'El precio mínimo es 100 MXN').max(500, 'El precio máximo es 500 MXN'),
  mysteryPackPrice: z.number().min(50, 'El precio mínimo es 50 MXN').max(300, 'El precio máximo es 300 MXN')
})
