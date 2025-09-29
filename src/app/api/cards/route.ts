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
    const search = searchParams.get('search')

    const result = await CardService.getAllCards(limit, offset, sort)

    // Apply search filter if provided
    let filteredCards = result.cards
    if (search && search.length > 0) {
      const searchLower = search.toLowerCase()
      filteredCards = result.cards.filter(card =>
        card.name.toLowerCase().includes(searchLower) ||
        card.certificationNumber.toString().includes(search) ||
        card.set.toLowerCase().includes(searchLower) ||
        card.tcg?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        cards: filteredCards,
        total: search ? filteredCards.length : result.total
      },
      meta: {
        pagination: {
          total: search ? filteredCards.length : result.total,
          limit,
          offset,
          hasNext: search ? false : offset + limit < result.total,
        },
        search: search || null
      }
    })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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