import { NextRequest, NextResponse } from 'next/server'
import { StoreService } from '@/lib/storeService'
import { UpdateStoreSchema } from '@/types/store'
import { validateApiKey, authenticateFirebaseToken } from '@/lib/auth'
import { UserService } from '@/lib/userService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación - Permitir tanto API key (admin) como Firebase token
    const hasApiKey = validateApiKey(request)
    const firebaseAuth = hasApiKey ? null : await authenticateFirebaseToken(request)
    
    if (!hasApiKey && !firebaseAuth) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Token de autenticación requerido' 
        },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Si es usuario Firebase, validar permisos
    if (!hasApiKey && firebaseAuth) {
      const userProfile = await UserService.getUserProfileByUid(firebaseAuth.uid)
      if (!userProfile || !userProfile.isActive) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Usuario no encontrado o inactivo' 
          },
          { status: 404 }
        )
      }

      // Solo admins y el owner de la tienda pueden acceder
      if (userProfile.role === 'store_owner' && userProfile.storeId !== id) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No tienes permisos para acceder a esta tienda' 
          },
          { status: 403 }
        )
      } else if (userProfile.role === 'customer') {
        return NextResponse.json(
          { 
            success: false,
            error: 'No tienes permisos para acceder a tiendas' 
          },
          { status: 403 }
        )
      }
    }

    const store = await StoreService.getStoreById(id)

    if (!store) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tienda no encontrada' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        store,
      },
    })
  } catch (error: any) {
    console.error('Error fetching store:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación - Permitir tanto API key (admin) como Firebase token
    const hasApiKey = validateApiKey(request)
    const firebaseAuth = hasApiKey ? null : await authenticateFirebaseToken(request)
    
    if (!hasApiKey && !firebaseAuth) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Token de autenticación requerido' 
        },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Si es usuario Firebase, validar permisos
    if (!hasApiKey && firebaseAuth) {
      const userProfile = await UserService.getUserProfileByUid(firebaseAuth.uid)
      if (!userProfile || !userProfile.isActive) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Usuario no encontrado o inactivo' 
          },
          { status: 404 }
        )
      }

      // Solo admins y el owner de la tienda pueden modificar
      if (userProfile.role === 'store_owner' && userProfile.storeId !== id) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No tienes permisos para modificar esta tienda' 
          },
          { status: 403 }
        )
      } else if (userProfile.role === 'customer') {
        return NextResponse.json(
          { 
            success: false,
            error: 'No tienes permisos para modificar tiendas' 
          },
          { status: 403 }
        )
      }
    }
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = UpdateStoreSchema.parse(body)
    
    // Actualizar tienda
    const store = await StoreService.updateStore(id, validatedData)
    
    return NextResponse.json({
      success: true,
      data: {
        store,
      },
    })
  } catch (error: any) {
    console.error('Error updating store:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos de entrada inválidos', 
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Solo admins con API key pueden eliminar tiendas
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Se requiere acceso de administrador para eliminar tiendas' 
        },
        { status: 403 }
      )
    }

    const { id } = await params
    
    await StoreService.deleteStore(id)
    
    return NextResponse.json({
      success: true,
      message: 'Tienda desactivada exitosamente',
    })
  } catch (error: any) {
    console.error('Error deleting store:', error)
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
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