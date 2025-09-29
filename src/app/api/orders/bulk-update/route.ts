import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'
import { BulkUpdateOrderSchema } from '@/types/order'
import { validateApiKey } from '@/lib/auth'

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
    const validatedData = BulkUpdateOrderSchema.parse(body)
    
    // Ejecutar actualizaciones individuales (no existe bulkUpdateOrders)
    const results = []
    for (const orderId of validatedData.orderIds) {
      const updateData: any = {}
      if (validatedData.status) updateData.status = validatedData.status
      if (validatedData.assignedTo) updateData.assignedTo = validatedData.assignedTo
      if (validatedData.performedBy) updateData.performedBy = validatedData.performedBy

      const result = await OrderService.updateOrder(orderId, updateData)
      results.push(result)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        updated: results.length,
        errors: [],
        total: validatedData.orderIds.length,
        results: results
      },
      message: `${results.length} de ${validatedData.orderIds.length} órdenes actualizadas exitosamente`,
    })
  } catch (error: any) {
    console.error('Error in bulk update:', error)
    
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