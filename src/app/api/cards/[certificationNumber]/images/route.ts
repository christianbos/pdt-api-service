import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { FirebaseStorageService } from '@/lib/firebaseStorage'
import { ImageValidationService } from '@/lib/imageValidation'
import { validateApiKey } from '@/lib/auth'
import { CardImages, ImageType } from '@/types/card'

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

    // Obtener query parameters
    const { searchParams } = new URL(request.url)
    const includeUrls = searchParams.get('include_urls') === 'true'

    const images = card.images || {}
    const result: any = {
      certificationNumber: certNumber,
      images: {}
    }

    // Procesar imágenes main
    if (images.main) {
      result.images.main = {}
      for (const [type, metadata] of Object.entries(images.main)) {
        result.images.main[type] = {
          ...metadata,
          url: metadata.url || FirebaseStorageService.getPublicUrl(metadata.publicId)
        }
        
        if (includeUrls) {
          result.images.main[type].urls = FirebaseStorageService.getResponsiveUrls(certNumber, type as ImageType)
        }
      }
    }

    // Procesar imágenes specialized
    if (images.specialized) {
      result.images.specialized = {}
      for (const [type, metadata] of Object.entries(images.specialized)) {
        result.images.specialized[type] = {
          ...metadata,
          url: metadata.url || FirebaseStorageService.getPublicUrl(metadata.publicId)
        }
        
        if (includeUrls) {
          result.images.specialized[type].urls = FirebaseStorageService.getResponsiveUrls(certNumber, type as ImageType)
        }
      }
    }

    // Estadísticas
    const totalImages = Object.keys(images.main || {}).length + Object.keys(images.specialized || {}).length
    result.stats = {
      totalImages,
      main: Object.keys(images.main || {}).length,
      specialized: Object.keys(images.specialized || {}).length
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error getting card images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mantener compatibilidad con upload legacy
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
      
      return await FirebaseStorageService.uploadImage(
        buffer,
        certNumber,
        'front' as ImageType, // Default type for legacy uploads
        file.name
      )
    })

    const uploadResults = await Promise.all(uploadPromises)
    const imageUrls = uploadResults.map(result => result.publicUrl)

    // Mantener compatibilidad con el formato anterior
    const currentImages = (card as any).images || []
    const updatedImages = Array.isArray(currentImages) ? [...currentImages, ...imageUrls] : imageUrls

    const updatedCard = await CardService.updateCard(certNumber, {
      images: updatedImages as any
    })

    return NextResponse.json({
      message: 'Images uploaded successfully (legacy format)',
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
