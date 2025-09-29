import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/validate-store-code - Starting validation')

    // Verificar JWT token de Firebase
    const authData = await verifyFirebaseToken(request)

    if (!authData) {
      console.log('❌ JWT authentication failed')
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autenticación inválido o expirado'
        },
        { status: 401 }
      )
    }

    console.log('✅ JWT token valid for user:', authData.uid)

    const body = await request.json()
    const { accessCode } = body

    if (!accessCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código de acceso requerido'
        },
        { status: 400 }
      )
    }

    // Obtener códigos válidos desde variables de entorno
    const validCodes = process.env.STORE_ACCESS_CODES?.split(',') || []

    console.log('🔑 Validating access code:', accessCode)
    console.log('🔑 Available codes count:', validCodes.length)

    // Validar código
    const isValid = validCodes.includes(accessCode.toUpperCase().trim())

    if (isValid) {
      console.log('✅ Access code is valid')
    } else {
      console.log('❌ Access code is invalid')
    }

    return NextResponse.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Código válido' : 'Código inválido'
    })

  } catch (error: any) {
    console.error('❌ Error in /api/auth/validate-store-code:', error)
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