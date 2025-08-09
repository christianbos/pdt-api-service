import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { ImageValidationService } from '@/lib/imageValidation'
import { validateAdminAccess } from '@/lib/auth'
import { ImageType, ImageMetadata } from '@/types/card'
import { FirebaseStorageService } from '@/lib/firebaseStorage'

interface RouteParams {
  params: Promise<{ certificationNumber: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar acceso administrativo
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Admin access required' }, 
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

    // Obtener form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('imageType') as string
    
    if (!file || !imageType) {
      return NextResponse.json(
        { error: 'File and imageType are required' },
        { status: 400 }
      )
    }

    // Validar tipo de imagen
    if (!ImageValidationService.validateImageType(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type' },
        { status: 400 }
      )
    }

    const validImageType = imageType as ImageType

    // Verificar que la carta existe
    const card = await CardService.getCardByCertificationNumber(certNumber)
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Validar archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB límite para Firebase Storage
      return NextResponse.json(
        { error: 'File size must be less than 100MB' },
        { status: 400 }
      )
    }

    // Verificar configuración de Firebase
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Missing Firebase configuration:', {
        project_id: !!process.env.FIREBASE_PROJECT_ID,
        private_key: !!process.env.FIREBASE_PRIVATE_KEY,
        client_email: !!process.env.FIREBASE_CLIENT_EMAIL
      })
      return NextResponse.json(
        { error: 'Firebase configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Convertir archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    console.log('Uploading to Firebase Storage:', {
      certificationNumber: certNumber,
      fileSize: buffer.length,
      imageType: validImageType,
      fileName: file.name
    })

    // Upload a Firebase Storage
    const uploadResult = await FirebaseStorageService.uploadImage(
      buffer,
      certNumber,
      validImageType,
      file.name
    )

    console.log('Firebase Storage upload success:', {
      path: uploadResult.path,
      url: uploadResult.publicUrl
    })

    // Crear metadata de la imagen
    const imageMetadata: ImageMetadata = {
      publicId: uploadResult.path,
      url: uploadResult.publicUrl,
      width: 0, // Se puede obtener con sharp si es necesario
      height: 0, // Se puede obtener con sharp si es necesario  
      format: file.name.split('.').pop() || 'webp',
      size: uploadResult.size,
      uploadedAt: new Date().toISOString()
    }

    // Actualizar metadata en Firestore
    await CardService.updateCardImage(certNumber, validImageType, imageMetadata)

    return NextResponse.json({
      message: 'Image uploaded successfully to Firebase Storage',
      certificationNumber: certNumber,
      imageType: validImageType,
      metadata: imageMetadata,
      urls: FirebaseStorageService.getResponsiveUrls(certNumber, validImageType)
    })

  } catch (error: any) {
    console.error('Firebase Storage admin upload error:', error)
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}