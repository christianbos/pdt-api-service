import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { UpdateCardSchema } from '@/lib/validations'
import { validateApiKey } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ certificationNumber: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { certificationNumber } = await params
    const certNumber = parseInt(certificationNumber)
    
    if (isNaN(certNumber)) {
      return NextResponse.json(
        { error: 'Invalid certification number' },
        { status: 400 }
      )
    }

    const card = await CardService.getCardByCertificationNumber(certNumber)
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(card)
  } catch (error) {
    console.error('Error fetching card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { certificationNumber } = await params
    const certNumber = parseInt(certificationNumber)
    
    if (isNaN(certNumber)) {
      return NextResponse.json(
        { error: 'Invalid certification number' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateCardSchema.parse(body)
    
    const updatedCard = await CardService.updateCard(certNumber, validatedData)
    
    return NextResponse.json(updatedCard)
  } catch (error: any) {
    console.error('Error updating card:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { certificationNumber } = await params
    const certNumber = parseInt(certificationNumber)
    
    if (isNaN(certNumber)) {
      return NextResponse.json(
        { error: 'Invalid certification number' },
        { status: 400 }
      )
    }

    await CardService.deleteCard(certNumber)
    
    return NextResponse.json({ message: 'Card deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting card:', error)
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}