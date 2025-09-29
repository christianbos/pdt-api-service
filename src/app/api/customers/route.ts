import { NextRequest, NextResponse } from 'next/server'
import { CustomerService } from '@/lib/customerService'
import { CreateCustomerSchema } from '@/types/customer'
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await CustomerService.getAllCustomers(limit, offset)

    return NextResponse.json({
      success: true,
      data: {
        customers: result.customers,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasNext: offset + limit < result.total,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching customers:', error)
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

export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = CreateCustomerSchema.parse(body)
    
    // Crear cliente
    const customer = await CustomerService.createCustomer(validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        customer,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos de entrada inválidos', 
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }
    
    if (error.message.includes('Ya existe un cliente')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 409 }
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