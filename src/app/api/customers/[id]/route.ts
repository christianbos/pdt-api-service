import { NextRequest, NextResponse } from 'next/server'
import { CustomerService } from '@/lib/customerService'
import { UpdateCustomerSchema } from '@/types/customer'
import { requireFlexibleAuth } from '@/lib/auth'
import { CustomClaimsService } from '@/lib/customClaimsService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authData = await requireFlexibleAuth(request)
    if (!authData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión inválida, expirada o sin acceso a la API'
        },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar permisos para acceder al customer
    if (!CustomClaimsService.canAccessCustomer(authData.claims, id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para acceder a este cliente'
        },
        { status: 403 }
      )
    }
    const customer = await CustomerService.getCustomerById(id)

    if (!customer) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cliente no encontrado' 
        },
        { status: 404 }
      )
    }

    // Obtener historial de órdenes
    const orderHistory = await CustomerService.getCustomerOrderHistory(id)

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          ...customer,
          orderHistory,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching customer:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authData = await requireFlexibleAuth(request)
    if (!authData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión inválida, expirada o sin acceso a la API'
        },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar permisos para actualizar el customer
    if (!CustomClaimsService.canAccessCustomer(authData.claims, id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes permisos para actualizar este cliente'
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar datos de entrada
    const validatedData = UpdateCustomerSchema.parse(body)
    
    // Actualizar cliente
    const customer = await CustomerService.updateCustomer(id, validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        customer,
      },
    })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    
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
    
    if (error.message.includes('no encontrado')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authData = await requireFlexibleAuth(request)
    if (!authData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión inválida, expirada o sin acceso a la API'
        },
        { status: 401 }
      )
    }

    const { id } = await params

    // Solo admins pueden eliminar customers
    if (authData.claims.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Solo administradores pueden eliminar clientes'
        },
        { status: 403 }
      )
    }

    await CustomerService.deleteCustomer(id)
    
    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    
    if (error.message.includes('no encontrado')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
      )
    }

    if (error.message.includes('No se puede eliminar')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
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