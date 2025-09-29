import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/userService'
import { verifyFirebaseToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me - Starting JWT authentication')
    console.log('🔍 Request URL:', request.url)
    console.log('🔍 Request method:', request.method)

    // Log headers para debugging
    const authHeader = request.headers.get('authorization')
    console.log('Authorization header present:', !!authHeader)
    console.log('Authorization header starts with Bearer:', authHeader?.startsWith('Bearer '))
    if (authHeader) {
      console.log('Authorization header length:', authHeader.length)
      console.log('Token preview:', authHeader.substring(0, 50) + '...')
    }

    // Verificar JWT token de Firebase
    const authData = await verifyFirebaseToken(request)

    if (!authData) {
      console.log('❌ JWT authentication failed - 401 response')
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autenticación inválido o expirado. Por favor inicia sesión.'
        },
        { status: 401 }
      )
    }

    console.log('✅ JWT token valid for user:', {
      uid: authData.uid,
      email: authData.email
    })

    // Obtener/crear datos del usuario (con custom claims)
    console.log('👤 Getting/creating user data for UID:', authData.uid)
    console.log('👤 Token data provided:', {
      email: authData.email,
      name: authData.name
    })

    let userData
    try {
      console.log('🔄 Calling UserService.getAuthMeData...')
      userData = await UserService.getAuthMeData(authData.uid, {
        email: authData.email,
        name: authData.name
      })
      console.log('👤 UserService.getAuthMeData completed successfully')
      console.log('👤 UserService.getAuthMeData returned:', {
        hasUser: !!userData?.user,
        userRole: userData?.user?.role,
        needsTokenRefresh: userData?.needsTokenRefresh || false
      })
    } catch (userServiceError) {
      console.log('❌ UserService.getAuthMeData failed:', userServiceError)
      throw userServiceError
    }

    if (!userData) {
      console.log('❌ User creation failed for UID:', authData.uid)
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo crear o encontrar el usuario'
        },
        { status: 500 }
      )
    }

    console.log('✅ User data ready:', {
      uid: authData.uid,
      userRole: userData.user?.role,
      hasCustomer: !!userData.customer,
      hasStore: !!userData.store
    })

    // For new users, tell them to refresh their token to get custom claims
    if (!userData.user) {
      console.log('ℹ️ New user detected - they may need to refresh their token')
    }

    return NextResponse.json({
      success: true,
      data: userData,
      needsTokenRefresh: !userData.user // Indicate if token refresh needed
    })
  } catch (error: any) {
    console.error('❌ Error in /api/auth/me:', error)
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