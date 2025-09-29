import { getAuth } from 'firebase-admin/auth'
import { UserRole } from '@/types/user'

export interface CustomClaims {
  role: UserRole
  apiAccess: boolean
  customerId?: string
  storeId?: string
  permissions?: string[]
}

export class CustomClaimsService {
  /**
   * Asignar custom claims a un usuario según su rol
   */
  static async setUserClaims(uid: string, role: UserRole, relationId?: string): Promise<void> {
    try {
      // First, verify the user exists in Firebase Auth
      const auth = getAuth()
      await auth.getUser(uid)  // This will throw if user doesn't exist

      const claims: CustomClaims = {
        role,
        apiAccess: true
      }

      // Asignar claims específicos por rol
      switch (role) {
        case 'customer':
          if (relationId) {
            claims.customerId = relationId
          }
          break

        case 'store_owner':
          if (relationId) {
            claims.storeId = relationId
            claims.permissions = ['manage:orders', 'read:customers']
          }
          break

        case 'admin':
          claims.permissions = ['*']
          break
      }

      await auth.setCustomUserClaims(uid, claims)
      console.log(`Custom claims set for user ${uid}:`, claims)
    } catch (error: any) {
      console.error('Error setting custom claims:', error)

      // More specific error handling
      if (error.code === 'auth/user-not-found') {
        throw new Error(`Usuario no existe en Firebase Auth. UID: ${uid}`)
      }

      throw new Error(`Error al asignar claims al usuario: ${error.message}`)
    }
  }

  /**
   * Obtener custom claims de un usuario
   */
  static async getUserClaims(uid: string): Promise<CustomClaims | null> {
    try {
      const userRecord = await getAuth().getUser(uid)
      return userRecord.customClaims as CustomClaims || null
    } catch (error: any) {
      console.error('Error getting custom claims:', error)
      throw new Error(`Error al obtener claims del usuario: ${error.message}`)
    }
  }

  /**
   * Remover custom claims de un usuario
   */
  static async removeUserClaims(uid: string): Promise<void> {
    try {
      await getAuth().setCustomUserClaims(uid, null)
      console.log(`Custom claims removed for user ${uid}`)
    } catch (error: any) {
      console.error('Error removing custom claims:', error)
      throw new Error(`Error al remover claims del usuario: ${error.message}`)
    }
  }

  /**
   * Actualizar claims cuando cambia el rol o relación del usuario
   */
  static async updateUserClaims(
    uid: string,
    role: UserRole,
    customerId?: string,
    storeId?: string
  ): Promise<void> {
    try {
      const relationId = role === 'customer' ? customerId :
                        role === 'store_owner' ? storeId :
                        undefined

      await this.setUserClaims(uid, role, relationId)
    } catch (error: any) {
      console.error('Error updating custom claims:', error)
      throw new Error(`Error al actualizar claims del usuario: ${error.message}`)
    }
  }

  /**
   * Verificar si un usuario tiene permiso específico
   */
  static hasPermission(claims: CustomClaims, permission: string): boolean {
    if (!claims.apiAccess) return false
    if (claims.permissions?.includes('*')) return true
    return claims.permissions?.includes(permission) || false
  }

  /**
   * Verificar si un usuario puede acceder a un customer específico
   */
  static canAccessCustomer(claims: CustomClaims, customerId: string): boolean {
    if (!claims.apiAccess) return false
    if (claims.role === 'admin') return true
    if (claims.role === 'customer') return claims.customerId === customerId
    return false
  }

  /**
   * Verificar si un usuario puede acceder a una store específica
   */
  static canAccessStore(claims: CustomClaims, storeId: string): boolean {
    if (!claims.apiAccess) return false
    if (claims.role === 'admin') return true
    if (claims.role === 'store_owner') return claims.storeId === storeId
    return false
  }
}