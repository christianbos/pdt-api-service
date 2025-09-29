import { NextRequest, NextResponse } from 'next/server'
import { StoreService } from '@/lib/storeService'
import { CreateStoreSchema } from '@/types/store'
import { validateApiKey } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await StoreService.getAllStores(limit, offset)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Error fetching stores:', error)
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
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = CreateStoreSchema.parse(body)
    
    // Crear tienda
    const store = await StoreService.createStore(validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        store,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating store:', error)
    
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