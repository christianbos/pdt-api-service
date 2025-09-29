import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/orderService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📨 [API] Get cards for order ${params.id}`)

    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Get cards for the order
    const cards = await OrderService.getOrderCards(params.id)

    return NextResponse.json({
      success: true,
      data: cards,
      message: `Found ${cards.length} cards for order ${params.id}`
    })

  } catch (error: any) {
    console.error('❌ [API] Error getting order cards:', error)

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