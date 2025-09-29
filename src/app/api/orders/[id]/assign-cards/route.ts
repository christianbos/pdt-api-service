import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📨 [API] Assign cards to order ${params.id}`)

    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cardIds } = body

    if (!cardIds || !Array.isArray(cardIds)) {
      return NextResponse.json(
        { success: false, error: 'cardIds array is required' },
        { status: 400 }
      )
    }

    // Assign cards to the order
    const updatedOrder = await OrderService.assignCardsToOrder(params.id, cardIds)

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `${cardIds.length} cartas asignadas exitosamente a la orden ${updatedOrder.uuid}`
    })

  } catch (error: any) {
    console.error('❌ [API] Error assigning cards to order:', error)

    const statusCode = error.message.includes('no encontrada') ? 404 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor'
      },
      { status: statusCode }
    )
  }
}