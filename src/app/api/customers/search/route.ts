import { NextRequest, NextResponse } from 'next/server'
import { CustomerService } from '@/lib/customerService'
import { CustomerSearchSchema } from '@/types/customer'
import { validateApiKey } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!q) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Query de búsqueda es requerido (parámetro q)' 
        },
        { status: 400 }
      )
    }

    // Validar parámetros
    const validatedParams = CustomerSearchSchema.parse({
      q,
      limit,
      offset,
    })

    const result = await CustomerService.searchCustomers(
      validatedParams.q,
      validatedParams.limit,
      validatedParams.offset
    )

    return NextResponse.json({
      success: true,
      data: {
        customers: result.customers,
        total: result.total,
        query: validatedParams.q,
      },
    })
  } catch (error: any) {
    console.error('Error searching customers:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Parámetros de búsqueda inválidos', 
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}