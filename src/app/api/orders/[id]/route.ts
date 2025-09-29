import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'
import { UpdateOrderSchema } from '@/types/order'
import { validateApiKey } from '@/lib/auth'

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

    return NextResponse.json({
      success: true,
      data: {
        order,
      },
    })
  } catch (error: any) {
    console.error('Error fetching order:', error)
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
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = UpdateOrderSchema.parse(body)
    
    // Actualizar orden
    const order = await OrderService.updateOrder(id, validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        order,
      },
    })
  } catch (error: any) {
    console.error('Error updating order:', error)
    
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

export async function DELETE(
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
    
    await OrderService.deleteOrder(id)
    
    return NextResponse.json({
      success: true,
      message: 'Orden eliminada exitosamente',
    })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    
    if (error.message.includes('no encontrada')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
      )
    }

    if (error.message.includes('Solo se pueden eliminar')) {
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