import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'
import { CreateOrderSchema, OrderStatus } from '@/types/order'
import { requireFlexibleAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 /api/orders GET - Starting request')
    console.log('📋 /api/orders GET - Request URL:', request.url)
    console.log('📋 /api/orders GET - Authorization header present:', !!request.headers.get('authorization'))

    // Verificar autenticación con session cookie (preferido) o JWT token (fallback)
    const authData = await requireFlexibleAuth(request)

    console.log('📋 /api/orders GET - Auth result:', {
      hasAuthData: !!authData,
      uid: authData?.uid,
      role: authData?.claims?.role,
      customerId: authData?.claims?.customerId,
      storeId: authData?.claims?.storeId,
      apiAccess: authData?.claims?.apiAccess
    })

    if (!authData) {
      console.log('❌ /api/orders GET - Authentication failed, returning 401')
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión inválida, expirada o sin acceso a la API'
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Máximo 100

    // Filtros base
    let status = searchParams.get('status') as OrderStatus | null
    let storeId = searchParams.get('storeId')
    let customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    // Aplicar filtros por rol usando custom claims
    switch (authData.claims.role) {
      case 'store_owner':
        // Store owners solo ven órdenes de su tienda
        if (!authData.claims.storeId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Usuario no tiene tienda asignada'
            },
            { status: 400 }
          )
        }
        storeId = authData.claims.storeId // Forzar filtro por su tienda
        break

      case 'customer':
        // Customers solo ven sus propias órdenes
        if (!authData.claims.customerId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Usuario no tiene perfil de cliente asignado'
            },
            { status: 400 }
          )
        }
        customerId = authData.claims.customerId // Forzar filtro por su customer
        break

      case 'admin':
        // Admins pueden ver todas las órdenes sin restricciones adicionales
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Rol de usuario no válido'
          },
          { status: 400 }
        )
    }

    // Ordenamiento
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'estimatedDelivery' || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'

    // Filter sortBy to only valid values
    const validSortBy = ['createdAt', 'updatedAt', 'total', 'customerName'].includes(sortBy) ?
      sortBy as 'createdAt' | 'updatedAt' | 'total' | 'customerName' :
      'createdAt'

    const result = await OrderService.getOrders({
      page,
      limit,
      status: status || undefined,
      storeId: storeId || undefined,
      customerId: customerId || undefined,
      search: search || undefined,
      sortBy: validSortBy,
      sortOrder,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
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
    // Verificar autenticación con session cookie (preferido) o JWT token (fallback)
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

    const body = await request.json()
    let validatedData = CreateOrderSchema.parse(body)

    // Validar permisos según rol usando custom claims
    switch (authData.claims.role) {
      case 'store_owner':
        // Store owners solo pueden crear órdenes para su tienda
        if (!authData.claims.storeId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Usuario no tiene tienda asignada'
            },
            { status: 400 }
          )
        }

        // Forzar que la orden sea para su tienda
        validatedData = {
          ...validatedData,
          storeId: authData.claims.storeId
        }
        break

      case 'customer':
        // Customers pueden crear órdenes, agregar customerId automáticamente
        if (authData.claims.customerId) {
          validatedData = {
            ...validatedData,
            customerId: authData.claims.customerId
          }
        }
        break

      case 'admin':
        // Admins pueden crear cualquier orden sin restricciones
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Rol de usuario no válido'
          },
          { status: 400 }
        )
    }
    
    // Crear orden
    const order = await OrderService.createOrder(validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        order,
        uuid: order.uuid,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    
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
    
    if (error.message.includes('no encontrada') || error.message.includes('no está activa')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
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