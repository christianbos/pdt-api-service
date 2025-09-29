import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { UserService } from '@/lib/userService'
import { CustomClaimsService } from '@/lib/customClaimsService'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 /api/auth/refresh-claims - Starting claims refresh process')

    // Obtener token JWT del usuario
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      console.log('❌ No authorization header found')
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autorización requerido'
        },
        { status: 401 }
      )
    }

    const idToken = authorization.substring(7)
    console.log('🔑 JWT token found, verifying...')

    // Verificar token (sin requerir claims todavía)
    const decodedToken = await getAuth().verifyIdToken(idToken)
    const uid = decodedToken.uid
    const email = decodedToken.email
    const name = decodedToken.name || email

    console.log('✅ Token verified for user:', { uid, email })

    // Obtener o crear perfil de usuario completo
    console.log('👤 Getting or creating user profile...')
    const userData = await UserService.getAuthMeData(uid, { email, name })

    if (userData && userData.user) {
      console.log('✅ User profile found/created:', {
        uid: userData.user.uid,
        role: userData.user.role,
        customerId: userData.user.customerId,
        storeId: userData.user.storeId
      })

      // Refrescar Custom Claims basado en el perfil
      console.log('🔄 Refreshing custom claims...')
      await CustomClaimsService.updateUserClaims(
        uid,
        userData.user.role,
        userData.user.customerId,
        userData.user.storeId
      )

      // Crear nueva session cookie con claims actualizados
      console.log('🍪 Creating new session cookie with updated claims...')
      const expiresIn = 14 * 24 * 60 * 60 * 1000 // 14 días
      const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

      const response = NextResponse.json({
        success: true,
        message: 'Claims actualizados exitosamente. Nueva sesión creada.',
        data: userData
      })

      // Establecer nueva cookie con claims actualizados
      response.cookies.set('__session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })

      console.log('✅ Claims refreshed and new session cookie created for user:', uid)
      return response

    } else {
      console.log('❌ Could not create user profile for:', uid)
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo crear el perfil de usuario'
        },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error refreshing claims:', error)

    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        {
          success: false,
          error: 'Token expirado. Por favor, inicia sesión nuevamente.'
        },
        { status: 401 }
      )
    }

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