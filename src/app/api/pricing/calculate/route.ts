import { NextRequest, NextResponse } from 'next/server'
import { OrderPricingService } from '@/lib/orderPricing'
import { StoreService } from '@/lib/storeService'
import { ProductType, OrderItem } from '@/types/order'
import { validateApiKey } from '@/lib/auth'

interface CalculatePricingRequest {
  storeId?: string
  items: {
    productType: ProductType
    quantity: number
  }[]
}

export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const body: CalculatePricingRequest = await request.json()
    
    // Validar entrada básica
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Se requiere al menos un producto' 
        },
        { status: 400 }
      )
    }

    let store = null
    
    // Si hay storeId, obtener la tienda
    if (body.storeId) {
      store = await StoreService.getStoreById(body.storeId)
      if (!store) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Tienda no encontrada' 
          },
          { status: 404 }
        )
      }
      if (store.status !== 'active') {
        return NextResponse.json(
          { 
            success: false,
            error: 'La tienda no está activa' 
          },
          { status: 400 }
        )
      }
    }

    // Calcular precios para cada producto
    const orderItems: OrderItem[] = body.items.map(item => 
      OrderPricingService.createOrderItem(item.productType, item.quantity, store || undefined)
    )

    // Calcular total
    const total = OrderPricingService.calculateOrderTotal(orderItems)

    // Información adicional sobre precios
    const pricingInfo = {
      isDirectCustomer: !store,
      storeName: store?.name || null,
      gradingPrice: store ? store.gradingPrice : 350,
      mysteryPackPrice: store ? store.mysteryPackPrice : 150
    }

    return NextResponse.json({
      success: true,
      data: {
        items: orderItems,
        total,
        pricingInfo
      }
    })
    
  } catch (error: any) {
    console.error('Error calculating pricing:', error)
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