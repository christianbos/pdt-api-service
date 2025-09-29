import { db, COLLECTIONS } from '@/lib/firebase'
import { UserProfile, CreateUserProfileRequest, AuthMeResponse, UserRole } from '@/types/user'
import { StoreService } from '@/lib/storeService'
import { CustomerService } from '@/lib/customerService'
import { CustomClaimsService } from '@/lib/customClaimsService'
import { DocumentReference, Timestamp, FieldValue } from 'firebase-admin/firestore'

export class UserService {
  private static readonly COLLECTION = COLLECTIONS.USERS

  // Crear nuevo perfil de usuario
  static async createUserProfile(userData: CreateUserProfileRequest): Promise<UserProfile> {
    try {
      const now = new Date().toISOString()
      
      const userProfile: Omit<UserProfile, 'documentId'> = {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        storeId: userData.storeId,
        customerId: userData.customerId,
        createdAt: now,
        updatedAt: now,
        isActive: true
      }

      // Usar UID como document ID para fácil búsqueda
      const docRef = db.collection(this.COLLECTION).doc(userData.uid)
      await docRef.set(userProfile)

      // Set custom claims for role-based access
      console.log('👤 UserService - Setting custom claims for new user:', {
        uid: userData.uid,
        role: userData.role,
        customerId: userData.customerId,
        storeId: userData.storeId,
        relationId: userData.customerId || userData.storeId
      })

      await CustomClaimsService.setUserClaims(userData.uid, userData.role, userData.customerId || userData.storeId)

      console.log('✅ UserService - Custom claims set successfully')

      // Verify the claims were set
      try {
        const verificationClaims = await CustomClaimsService.getUserClaims(userData.uid)
        console.log('🔍 UserService - Verification of set claims:', verificationClaims)
      } catch (verifyError) {
        console.warn('⚠️ UserService - Could not verify claims were set:', verifyError)
      }

      return {
        ...userProfile,
        documentId: userData.uid
      }
    } catch (error: any) {
      console.error('Error creating user profile:', error)
      throw new Error(`Error al crear perfil de usuario: ${error.message}`)
    }
  }

  // Obtener perfil de usuario por UID
  static async getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    try {
      const doc = await db.collection(this.COLLECTION).doc(uid).get()
      
      if (!doc.exists) {
        return null
      }

      const data = doc.data()!
      return {
        documentId: doc.id,
        ...data
      } as UserProfile
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      throw new Error(`Error al obtener perfil de usuario: ${error.message}`)
    }
  }

  // Actualizar perfil de usuario
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const docRef = db.collection(this.COLLECTION).doc(uid)
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      delete updateData.uid // No permitir cambiar UID
      delete updateData.documentId // No permitir cambiar document ID

      await docRef.update(updateData)

      const updatedDoc = await docRef.get()
      const data = updatedDoc.data()! as UserProfile

      // No need for custom claims anymore

      return {
        documentId: updatedDoc.id,
        ...data
      } as UserProfile
    } catch (error: any) {
      console.error('Error updating user profile:', error)
      if (error.code === 5) { // Document not found
        throw new Error('Usuario no encontrado')
      }
      throw new Error(`Error al actualizar perfil de usuario: ${error.message}`)
    }
  }

  // Desactivar usuario (soft delete)
  static async deactivateUser(uid: string): Promise<void> {
    try {
      await db.collection(this.COLLECTION).doc(uid).update({
        isActive: false,
        updatedAt: new Date().toISOString()
      })

      // User deactivated - no custom claims to remove
    } catch (error: any) {
      console.error('Error deactivating user:', error)
      if (error.code === 5) {
        throw new Error('Usuario no encontrado')
      }
      throw new Error(`Error al desactivar usuario: ${error.message}`)
    }
  }

  // Obtener datos completos para auth/me
  static async getAuthMeData(
    uid: string,
    tokenData?: { email?: string; name?: string }
  ): Promise<AuthMeResponse | null> {
    try {
      console.log('👤 UserService.getAuthMeData - Looking up user profile for UID:', uid)
      let userProfile = await this.getUserProfileByUid(uid)

      console.log('👤 UserService.getAuthMeData - User profile lookup result:', {
        exists: !!userProfile,
        uid: userProfile?.uid,
        role: userProfile?.role,
        customerId: userProfile?.customerId,
        storeId: userProfile?.storeId,
        isActive: userProfile?.isActive
      })

      // Auto-crear perfil si no existe y tenemos datos del token
      if (!userProfile && tokenData?.email) {
        console.log('🆕 Auto-creating new user profile for UID:', uid)

        // Crear customer automáticamente para nuevos usuarios
        console.log('🆕 UserService - Auto-creating customer for new user')
        const customer = await CustomerService.createCustomer({
          name: tokenData.name || tokenData.email.split('@')[0], // Use email prefix as name
          phone: '', // Se puede actualizar después
          email: tokenData.email // Incluir email del usuario
        })
        console.log('✅ UserService - Customer created:', customer.documentId)

        console.log('🆕 UserService - Auto-creating user profile with customer role')
        userProfile = await this.createUserProfile({
          uid,
          email: tokenData.email,
          name: tokenData.name || tokenData.email.split('@')[0],
          role: 'customer', // rol por defecto siempre customer
          storeId: undefined,
          customerId: customer.documentId
        })

        console.log('✅ Auto-created user profile with claims:', {
          uid,
          role: userProfile.role,
          customerId: userProfile.customerId,
          email: userProfile.email
        })

        console.log('✅ User auto-creation completed!')
      }

      if (!userProfile || !userProfile.isActive) {
        console.log('❌ UserService.getAuthMeData - User profile not found or inactive')
        return null
      }

      // Check if user has custom claims, if not, set them
      console.log('🔍 UserService.getAuthMeData - Checking if user has custom claims...')
      let claimsUpdated = false
      try {
        const existingClaims = await CustomClaimsService.getUserClaims(uid)
        console.log('🔍 UserService.getAuthMeData - Existing claims:', existingClaims)

        if (!existingClaims || !existingClaims.apiAccess || existingClaims.role !== userProfile.role) {
          console.log('⚠️ UserService.getAuthMeData - Custom claims missing or outdated, setting them...')
          await CustomClaimsService.setUserClaims(
            uid,
            userProfile.role,
            userProfile.customerId || userProfile.storeId
          )

          // Verify they were set
          const newClaims = await CustomClaimsService.getUserClaims(uid)
          console.log('✅ UserService.getAuthMeData - Claims updated:', newClaims)
          claimsUpdated = true
        } else {
          console.log('✅ UserService.getAuthMeData - Custom claims are already correct')
        }
      } catch (claimsError) {
        console.error('❌ UserService.getAuthMeData - Error checking/setting custom claims:', claimsError)
      }

      // Construir respuesta base (se actualiza después según rol)
      let response: AuthMeResponse = {
        user: {
          uid: userProfile.uid,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          isActive: userProfile.isActive,
          ...(userProfile.customerId && { customerId: userProfile.customerId }),
          ...(userProfile.storeId && { storeId: userProfile.storeId })
        }
      }

      // Validar y obtener datos según rol del usuario
      switch (userProfile.role) {
        case 'customer':
          // Si no tiene customerId, crear customer automáticamente
          if (!userProfile.customerId) {
            console.log('Creating customer for existing user without customerId:', uid)
            const customer = await CustomerService.createCustomer({
              name: userProfile.name,
              phone: '', // Se puede actualizar después
              email: userProfile.email // Incluir email del usuario
            })

            // Actualizar el perfil del usuario con el customerId
            userProfile = await this.updateUserProfile(uid, { customerId: customer.documentId })

            // Actualizar la respuesta con el nuevo customerId
            response.user.customerId = customer.documentId
          }
          try {
            const customer = await CustomerService.getCustomerById(userProfile.customerId)
            if (!customer) {
              throw new Error('Customer profile not found for user')
            }
            response.customer = {
              documentId: customer.documentId,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              totalOrders: customer.totalOrders || 0,
              totalSpent: customer.totalSpent || 0,
              createdAt: customer.createdAt,
              updatedAt: customer.updatedAt
            }
          } catch (error: any) {
            console.error('Error fetching customer data for user:', error)
            throw new Error(`Error al obtener datos del cliente: ${error.message}`)
          }
          break

        case 'store_owner':
          if (!userProfile.storeId) {
            throw new Error('Store ID missing for store owner role user. Please contact administrator to assign a store.')
          }
          try {
            const store = await StoreService.getStoreById(userProfile.storeId)
            if (!store) {
              throw new Error('Store profile not found for user')
            }
            response.store = {
              documentId: store.documentId,
              name: store.name,
              email: store.email,
              phone: store.phone,
              address: store.address,
              logoUrl: store.logoUrl,
              status: store.status,
              gradingPrice: store.gradingPrice,
              mysteryPackPrice: store.mysteryPackPrice,
              createdAt: store.createdAt,
              updatedAt: store.updatedAt
            }
          } catch (error: any) {
            console.error('Error fetching store data for user:', error)
            throw new Error(`Error al obtener datos de la tienda: ${error.message}`)
          }
          break

        case 'admin':
          // Solo datos del user para admin
          break

        default:
          throw new Error(`Invalid user role: ${userProfile.role}`)
      }

      // Add needsTokenRefresh flag if claims were just updated
      const responseWithRefreshFlag = {
        ...response,
        ...(claimsUpdated && { needsTokenRefresh: true })
      }

      console.log('✅ UserService.getAuthMeData - Returning response:', {
        uid: responseWithRefreshFlag.user.uid,
        role: responseWithRefreshFlag.user.role,
        hasStore: !!responseWithRefreshFlag.store,
        hasCustomer: !!responseWithRefreshFlag.customer,
        needsTokenRefresh: responseWithRefreshFlag.needsTokenRefresh
      })

      return responseWithRefreshFlag
    } catch (error: any) {
      console.error('Error getting auth me data:', error)
      throw new Error(`Error al obtener datos de autenticación: ${error.message}`)
    }
  }

  // Asignar rol a usuario existente
  static async assignRole(uid: string, role: UserRole, relationId?: string): Promise<UserProfile> {
    try {
      const updates: Partial<UserProfile> = {
        role: role
      }

      if (role === 'store_owner' && relationId) {
        updates.storeId = relationId
        updates.customerId = undefined // Limpiar customer ID si existía
      } else if (role === 'customer' && relationId) {
        updates.customerId = relationId
        updates.storeId = undefined // Limpiar store ID si existía
      } else if (role === 'admin') {
        // Admin no necesita relaciones específicas
        updates.storeId = undefined
        updates.customerId = undefined
      }

      return await this.updateUserProfile(uid, updates)
    } catch (error: any) {
      console.error('Error assigning role to user:', error)
      throw new Error(`Error al asignar rol al usuario: ${error.message}`)
    }
  }

  // Listar todos los usuarios (solo para admins)
  static async getAllUsers(limit: number = 50, offset: number = 0): Promise<{
    users: UserProfile[]
    total: number
  }> {
    try {
      const query = db.collection(this.COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)

      const snapshot = await query.get()
      const users: UserProfile[] = []

      snapshot.forEach(doc => {
        users.push({
          documentId: doc.id,
          ...doc.data()
        } as UserProfile)
      })

      // Obtener total de usuarios para paginación
      const countSnapshot = await db.collection(this.COLLECTION).count().get()
      const total = countSnapshot.data().count

      return { users, total }
    } catch (error: any) {
      console.error('Error listing users:', error)
      throw new Error(`Error al listar usuarios: ${error.message}`)
    }
  }
}