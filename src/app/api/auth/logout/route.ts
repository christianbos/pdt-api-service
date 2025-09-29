import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { authenticateFirebaseToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 POST /api/auth/logout - Starting logout process')

    // Intentar autenticar pero no requerir (logout debería funcionar siempre)
    const authData = await authenticateFirebaseToken(request)

    if (authData) {
      console.log('🔄 Valid auth found, revoking refresh tokens for user:', authData.uid)

      try {
        // Revocar tokens de refresh del usuario (invalida todos los JWT)
        await getAuth().revokeRefreshTokens(authData.uid)
        console.log('✅ Refresh tokens revoked successfully for user:', authData.uid)
      } catch (revokeError) {
        console.error('❌ Error revoking tokens:', revokeError)
      }
    } else {
      console.log('⚠️ No valid authentication found (token may be expired), proceeding with logout')
    }

    // Respuesta exitosa (el logout real se hace en el cliente con signOut)
    return NextResponse.json({
      success: true,
      message: 'Logout del servidor completado exitosamente'
    })
  } catch (error: any) {
    console.error('❌ Error during logout:', error)

    // Incluso si hay error, consideramos logout exitoso desde perspectiva del servidor
    return NextResponse.json({
      success: true,
      message: 'Logout completado con advertencias',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Método GET para logout también (compatible con redirects o navegación directa)
export async function GET(request: NextRequest) {
  console.log('🔑 GET /api/auth/logout - Redirecting to POST')
  return POST(request)
}