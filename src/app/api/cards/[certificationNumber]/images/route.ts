import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { CloudinaryService } from '@/lib/cloudinary'
import { validateApiKey } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ certificationNumber: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    const uploadPromises = files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = `image_${index + 1}_${Date.now()}`
      
      return await CloudinaryService.uploadImage(
        buffer,
        certNumber,
        fileName
      )
    })

    const uploadResults = await Promise.all(uploadPromises)
    const imageUrls = uploadResults.map(result => result.secure_url)

    const currentImages = card.data.images || []
    const updatedImages = [...currentImages, ...imageUrls]

    const updatedCard = await CardService.updateCard(certNumber, {
      images: updatedImages
    })

    return NextResponse.json({
      message: 'Images uploaded successfully',
      images: imageUrls,
      card: updatedCard
    })

  } catch (error: any) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}