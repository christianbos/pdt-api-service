import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'
import { validateApiKey } from '@/lib/auth'
import { z } from 'zod'
import { OrderStatus, getValidNextStatuses, ORDER_STATUS_METADATA } from '@/types/order'

const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'received', 'processing', 'completed', 'shipped', 'delivered']),
  performedBy: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = UpdateStatusSchema.parse(body)
    
    // Obtener la orden actual para verificar la transición
    const currentOrder = await OrderService.getOrderById(id)
    if (!currentOrder) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Orden no encontrada' 
        },
        { status: 404 }
      )
    }

    // Actualizar solo el estado
    const updatedOrder = await OrderService.updateOrder(id, {
      status: validatedData.status,
      performedBy: validatedData.performedBy
    })
    
    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        message: `Estado actualizado a: ${ORDER_STATUS_METADATA[validatedData.status].title}`
      }
    })
  } catch (error: any) {
    console.error('Error updating order status:', error)
    
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
    
    if (error.message.includes('Transición de estado inválida')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 400 }
      )
    }
    
    if (error.message.includes('no encontrada')) {
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

// GET endpoint para obtener los próximos estados válidos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Obtener la orden actual
    const order = await OrderService.getOrderById(id)
    if (!order) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Orden no encontrada' 
        },
        { status: 404 }
      )
    }

    const validNextStatuses = getValidNextStatuses(order.status)
    const statusOptions = validNextStatuses.map(status => ({
      value: status,
      label: ORDER_STATUS_METADATA[status].title,
      description: ORDER_STATUS_METADATA[status].description
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        currentStatus: {
          value: order.status,
          label: ORDER_STATUS_METADATA[order.status].title,
          description: ORDER_STATUS_METADATA[order.status].description
        },
        validNextStatuses: statusOptions,
        timeline: order.timeline || []
      }
    })
  } catch (error: any) {
    console.error('Error getting order status options:', error)
    
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