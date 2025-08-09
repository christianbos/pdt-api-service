import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { CloudinaryWebhookPayload, ImageType, ImageMetadata } from '@/types/card'
import { DirectUploadService } from '@/lib/directUpload'

export async function POST(request: NextRequest) {
  try {
    const payload: CloudinaryWebhookPayload = await request.json()
    
    // Validar que es una notificación de upload exitoso
    if (payload.notification_type !== 'upload') {
      return NextResponse.json({ message: 'Notification type not handled' }, { status: 200 })
    }

    // Extraer información del public_id
    const publicIdParts = payload.public_id.split('/')
    if (publicIdParts.length !== 3 || publicIdParts[0] !== 'cards') {
      return NextResponse.json({ error: 'Invalid public_id format' }, { status: 400 })
    }

    const certificationNumber = parseInt(publicIdParts[1])
    const imageType = publicIdParts[2] as ImageType

    if (isNaN(certificationNumber) || !DirectUploadService.validateImageType(imageType)) {
      return NextResponse.json({ error: 'Invalid certification number or image type' }, { status: 400 })
    }

    // Verificar que la carta existe
    const cardQuery = await db.collection('cards')
      .where('certificationNumber', '==', certificationNumber)
      .limit(1)
      .get()

    if (cardQuery.empty) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const cardDoc = cardQuery.docs[0]

    // Crear metadata de la imagen
    const imageMetadata: ImageMetadata = {
      publicId: payload.public_id,
      url: payload.secure_url,
      width: payload.width,
      height: payload.height,
      format: payload.format,
      size: payload.bytes,
      uploadedAt: new Date().toISOString()
    }

    // Determinar la categoría y actualizar la estructura de imágenes
    const category = DirectUploadService.getImageCategory(imageType)
    
    // Obtener las imágenes actuales o crear estructura vacía
    const currentCard = cardDoc.data()
    const currentImages = currentCard.images || { main: {}, specialized: {} }

    // Actualizar la imagen específica
    if (!currentImages[category]) {
      currentImages[category] = {}
    }
    currentImages[category][imageType] = imageMetadata

    // Actualizar el documento de la carta
    await cardDoc.ref.update({
      images: currentImages,
      updatedAt: new Date().toISOString()
    })

    // También crear/actualizar documento en subcollection para queries más eficientes
    await db.collection('cards')
      .doc(cardDoc.id)
      .collection('images')
      .doc(imageType)
      .set({
        ...imageMetadata,
        certificationNumber,
        category
      })

    return NextResponse.json({
      message: 'Image metadata saved successfully',
      certificationNumber,
      imageType,
      category,
      metadata: imageMetadata
    })

  } catch (error: any) {
    console.error('Cloudinary webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}