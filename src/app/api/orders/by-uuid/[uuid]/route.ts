import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  try {
    const params = await context.params
    const { uuid } = params

    // Validar formato UUID (básico)
    if (!uuid || uuid.length < 5) {
      return NextResponse.json(
        { 
          success: false,
          error: 'UUID de orden inválido' 
        },
        { status: 400 }
      )
    }

    // Este endpoint es público (para tracking), no requiere API key
    const order = await OrderService.getOrderByUuid(uuid)

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Orden no encontrada'
        },
        { status: 404 }
      )
    }

    // Get customer email if available
    let customerEmail = undefined
    if (order.customerId) {
      try {
        // Import CustomerService to get customer details
        const { CustomerService } = await import('@/lib/customerService')
        const customer = await CustomerService.getCustomerById(order.customerId)
        customerEmail = customer?.email
      } catch (error) {
        console.warn('Could not fetch customer email:', error)
      }
    }

    // Para el endpoint público, solo retornar información necesaria para tracking
    const publicOrderData = {
      uuid: order.uuid,
      status: order.status,
      customerName: order.customerName,
      // No mostrar teléfono completo por privacidad
      customerPhone: undefined, // Not available in Order model
      customerEmail: customerEmail || undefined,
      priority: undefined, // Not available in Order model
      total: order.total,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      storeName: order.storeName || undefined,
      timeline: order.timeline,
      cards: [], // Cards not populated in Order model - would need separate query
    }

    return NextResponse.json({
      success: true,
      data: {
        order: publicOrderData,
      },
    })
  } catch (error: any) {
    console.error('Error fetching order by UUID:', error)
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