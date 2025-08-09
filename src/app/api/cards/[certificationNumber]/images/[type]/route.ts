import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { FirebaseStorageService } from '@/lib/firebaseStorage'
import { ImageValidationService } from '@/lib/imageValidation'
import { validateApiKey } from '@/lib/auth'
import { ImageType } from '@/types/card'

interface RouteParams {
  params: Promise<{ 
    certificationNumber: string
    type: string 
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const { certificationNumber, type } = await params
    const certNumber = parseInt(certificationNumber)
    
    if (isNaN(certNumber)) {
      return NextResponse.json(
        { error: 'Invalid certification number' },
        { status: 400 }
      )
    }

    if (!ImageValidationService.validateImageType(type)) {
      return NextResponse.json(
        { error: 'Invalid image type' },
        { status: 400 }
      )
    }

    const imageType = type as ImageType

    // Verificar que la carta existe
    const card = await CardService.getCardByCertificationNumber(certNumber)
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Obtener información de la imagen desde la estructura
    const category = ImageValidationService.getImageCategory(imageType)
    const imageMetadata = category === 'main' 
      ? card.images?.main?.[imageType as keyof typeof card.images.main]
      : card.images?.specialized?.[imageType as keyof typeof card.images.specialized]

    if (!imageMetadata) {
      return NextResponse.json(
        { error: 'Image not found for this card' },
        { status: 404 }
      )
    }

    // Generar URLs con Firebase Storage
    const urls = FirebaseStorageService.getResponsiveUrls(certNumber, imageType)

    // URL principal es la URL original de la metadata
    const mainUrl = imageMetadata.url || FirebaseStorageService.getPublicUrl(imageMetadata.publicId)

    return NextResponse.json({
      certificationNumber: certNumber,
      imageType,
      category,
      metadata: imageMetadata,
      url: mainUrl,
      urls
    })

  } catch (error: any) {
    console.error('Error getting card image:', error)
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

    const { certificationNumber, type } = await params
    const certNumber = parseInt(certificationNumber)
    
    if (isNaN(certNumber) || !ImageValidationService.validateImageType(type)) {
      return NextResponse.json(
        { error: 'Invalid certification number or image type' },
        { status: 400 }
      )
    }

    const imageType = type as ImageType

    // Verificar que la carta existe
    const card = await CardService.getCardByCertificationNumber(certNumber)
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Eliminar imagen de Firebase Storage
    await FirebaseStorageService.deleteImage(certNumber, imageType)

    // Actualizar estructura de imágenes en la carta
    const category = ImageValidationService.getImageCategory(imageType)
    const updatedImages = { ...card.images }
    
    if (category === 'main' && updatedImages.main) {
      const key = imageType as keyof typeof updatedImages.main
      if (updatedImages.main[key]) {
        delete updatedImages.main[key]
        if (Object.keys(updatedImages.main).length === 0) {
          delete updatedImages.main
        }
      }
    } else if (category === 'specialized' && updatedImages.specialized) {
      const key = imageType as keyof typeof updatedImages.specialized
      if (updatedImages.specialized[key]) {
        delete updatedImages.specialized[key]
        if (Object.keys(updatedImages.specialized).length === 0) {
          delete updatedImages.specialized
        }
      }
    }

    // Actualizar carta en Firestore
    await CardService.updateCard(certNumber, {
      images: Object.keys(updatedImages).length > 0 ? updatedImages : undefined
    })

    return NextResponse.json({
      message: 'Image deleted successfully',
      certificationNumber: certNumber,
      imageType
    })

  } catch (error: any) {
    console.error('Error deleting card image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
