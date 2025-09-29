import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/userService'
import { authenticateFirebaseToken } from '@/lib/auth'
import { CreateUserProfileSchema } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    // Autenticar token Firebase
    const authData = await authenticateFirebaseToken(request)
    if (!authData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Token de autenticación inválido o expirado' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar que el UID del token coincida con el UID en el body
    if (body.uid && body.uid !== authData.uid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'UID en el cuerpo de la petición no coincide con el token' 
        },
        { status: 400 }
      )
    }

    // Usar UID del token y email si no vienen en el body
    const userData = {
      ...body,
      uid: authData.uid,
      email: body.email || authData.email
    }

    // Validar datos de entrada
    const validatedData = CreateUserProfileSchema.parse(userData)
    
    // Verificar si el usuario ya existe
    const existingUser = await UserService.getUserProfileByUid(validatedData.uid)
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'El usuario ya está registrado' 
        },
        { status: 409 }
      )
    }
    
    // Crear perfil de usuario
    const userProfile = await UserService.createUserProfile(validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        user: userProfile
      },
      message: 'Perfil de usuario creado exitosamente'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors?.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })) || []
        },
        { status: 400 }
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