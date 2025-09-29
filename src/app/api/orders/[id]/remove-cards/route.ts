import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log(`📨 [API] Remove cards from order ${params.id}`)

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

    // Remove cards from the order
    const updatedOrder = await OrderService.removeCardsFromOrder(params.id, cardIds)

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `${cardIds.length} cartas removidas exitosamente de la orden ${updatedOrder.uuid}`
    })

  } catch (error: any) {
    console.error('❌ [API] Error removing cards from order:', error)

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