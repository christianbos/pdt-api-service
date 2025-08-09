import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { FirebaseStorageService } from '@/lib/firebaseStorage'
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

    // Verificar que la carta existe
    const card = await CardService.getCardByCertificationNumber(certNumber)
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Obtener query parameters
    const { searchParams } = new URL(request.url)
    const side = searchParams.get('side') as 'front' | 'back' || 'front'
    const includeUrls = searchParams.get('include_urls') === 'true'

    // Validar side parameter
    if (side !== 'front' && side !== 'back') {
      return NextResponse.json(
        { error: 'Invalid side parameter. Must be "front" or "back"' },
        { status: 400 }
      )
    }

    // Obtener imágenes de esquinas
    const cornerImages = await CardService.getCardCornerImages(certNumber, side)
    
    // Procesar cada esquina
    const result: any = {
      certificationNumber: certNumber,
      side,
      corners: {}
    }

    const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const
    
    corners.forEach(corner => {
      const metadata = cornerImages[corner]
      
      if (metadata) {
        result.corners[corner] = {
          ...metadata,
          url: metadata.url || FirebaseStorageService.getPublicUrl(metadata.publicId)
        }
        
        if (includeUrls) {
          const imageType = `${side}_corner_${corner}` as any
          result.corners[corner].urls = FirebaseStorageService.getResponsiveUrls(certNumber, imageType)
        }
      } else {
        result.corners[corner] = null
      }
    })

    // Estadísticas
    const availableCorners = corners.filter(corner => cornerImages[corner] !== null)
    result.stats = {
      totalCorners: corners.length,
      availableCorners: availableCorners.length,
      missingCorners: corners.length - availableCorners.length,
      completeness: (availableCorners.length / corners.length) * 100,
      available: availableCorners,
      missing: corners.filter(corner => cornerImages[corner] === null)
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error getting card corners:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
