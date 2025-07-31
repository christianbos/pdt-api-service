import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { CreateCardSchema } from '@/lib/validations'
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
    const sort = searchParams.get('sort') as 'asc' | 'desc' | null

    const result = await CardService.getAllCards(limit, offset, sort)
    
    return NextResponse.json({
      data: result.cards,
      meta: {
        pagination: {
          total: result.total,
          limit,
          offset,
          hasNext: offset + limit < result.total,
        }
      }
    })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    
    const validatedData = CreateCardSchema.parse(body)
    
    const card = await CardService.createCard(validatedData)
    
    return NextResponse.json(card, { status: 201 })
  } catch (error: any) {
    console.error('Error creating card:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}