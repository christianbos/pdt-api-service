import { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { UserRole } from '@/types/user'
import { CustomClaims } from '@/lib/customClaimsService'

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.API_SECRET_KEY

  if (!expectedApiKey) {
    throw new Error('API_SECRET_KEY not configured')
  }

  return apiKey === expectedApiKey
}

export function createAuthMiddleware() {
  return (request: NextRequest) => {
    if (!validateApiKey(request)) {
      return Response.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }
    return null
  }
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD not configured')
  }

  return username === adminUsername && password === adminPassword
}

export function validateAdminAccess(request: NextRequest): boolean {
  // Por ahora usar el mismo validateApiKey para admin
  // En el futuro se podría implementar JWT o sesiones
  return validateApiKey(request)
}

// Verify Firebase JWT token - SIMPLIFIED (no custom claims needed)
export async function verifyFirebaseToken(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
} | null> {
  try {
    console.log('🔐 auth.ts - verifyFirebaseToken - Starting JWT token validation')

    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      console.log('❌ auth.ts - verifyFirebaseToken - No authorization header or not Bearer format')
      return null
    }

    const token = authorization.substring(7)
    console.log('🔑 auth.ts - verifyFirebaseToken - JWT token found, verifying with Firebase...')

    const decodedToken = await getAuth().verifyIdToken(token)
    console.log('✅ auth.ts - verifyFirebaseToken - JWT token verified:', {
      uid: decodedToken.uid,
      email: decodedToken.email
    })

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    }
  } catch (error) {
    console.error('❌ auth.ts - verifyFirebaseToken - Error verifying Firebase token:', error)
    return null
  }
}

// Middleware function to authenticate Firebase token - WITH CUSTOM CLAIMS
export async function authenticateFirebaseToken(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
  claims: CustomClaims | null
} | null> {
  try {
    console.log('🔐 authenticateFirebaseToken - Starting JWT token validation with claims')

    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      console.log('❌ authenticateFirebaseToken - No authorization header or not Bearer format')
      return null
    }

    const token = authorization.substring(7)
    console.log('🔑 authenticateFirebaseToken - JWT token found, verifying with Firebase...')

    const decodedToken = await getAuth().verifyIdToken(token)

    // Log ALL fields in the decoded token for debugging
    console.log('✅ authenticateFirebaseToken - JWT token verified. Full token contents:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      role: decodedToken.role,
      apiAccess: decodedToken.apiAccess,
      customerId: decodedToken.customerId,
      storeId: decodedToken.storeId,
      permissions: decodedToken.permissions,
      aud: decodedToken.aud,
      auth_time: decodedToken.auth_time,
      exp: decodedToken.exp,
      iat: decodedToken.iat,
      iss: decodedToken.iss,
      sub: decodedToken.sub,
      firebase: decodedToken.firebase,
      // Show all other custom claims
      customClaims: Object.keys(decodedToken).filter(key =>
        !['uid', 'email', 'name', 'aud', 'auth_time', 'exp', 'iat', 'iss', 'sub', 'firebase'].includes(key)
      ).reduce((obj, key) => ({ ...obj, [key]: decodedToken[key] }), {})
    })

    // Extract custom claims from the token
    const claims: CustomClaims | null = decodedToken.role ? {
      role: decodedToken.role,
      apiAccess: decodedToken.apiAccess || false,
      customerId: decodedToken.customerId,
      storeId: decodedToken.storeId,
      permissions: decodedToken.permissions
    } : null

    console.log('🔑 authenticateFirebaseToken - Claims extracted:', {
      claims,
      hasRole: !!decodedToken.role,
      hasApiAccess: !!decodedToken.apiAccess,
      roleValue: decodedToken.role,
      apiAccessValue: decodedToken.apiAccess
    })

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      claims
    }
  } catch (error) {
    console.error('❌ authenticateFirebaseToken - Error verifying Firebase token:', error)
    return null
  }
}

// New function to require authentication with custom claims
export async function requireFirebaseAuth(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
  claims: CustomClaims
} | null> {
  console.log('🔐 requireFirebaseAuth - Checking JWT authentication...')

  const authData = await authenticateFirebaseToken(request)

  if (!authData) {
    console.log('❌ requireFirebaseAuth - No auth data from authenticateFirebaseToken')
    return null
  }

  if (!authData.claims) {
    console.log('❌ requireFirebaseAuth - Auth data exists but no custom claims:', {
      uid: authData.uid,
      email: authData.email,
      hasClaims: !!authData.claims
    })
    return null
  }

  if (!authData.claims.apiAccess) {
    console.log('❌ requireFirebaseAuth - Custom claims exist but apiAccess is false:', {
      uid: authData.uid,
      claims: authData.claims
    })
    return null
  }

  console.log('✅ requireFirebaseAuth - Authentication successful:', {
    uid: authData.uid,
    role: authData.claims.role,
    apiAccess: authData.claims.apiAccess
  })

  return {
    uid: authData.uid,
    email: authData.email,
    name: authData.name,
    claims: authData.claims
  }
}

// Session Cookie Authentication (RECOMMENDED)
export async function authenticateSessionCookie(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
  claims: CustomClaims | null
} | null> {
  try {
    console.log('🔐 auth.ts - authenticateSessionCookie - Starting session cookie validation')

    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      console.log('❌ auth.ts - authenticateSessionCookie - No session cookie found')
      return null
    }

    console.log('🍪 auth.ts - authenticateSessionCookie - Session cookie found, verifying...')

    // Verificar session cookie
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true)
    console.log('✅ auth.ts - authenticateSessionCookie - Session cookie verified:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      hasRole: !!decodedToken.role,
      hasApiAccess: !!decodedToken.apiAccess
    })

    // Extraer custom claims del token de sesión
    const claims: CustomClaims | null = decodedToken.role ? {
      role: decodedToken.role,
      apiAccess: decodedToken.apiAccess || false,
      customerId: decodedToken.customerId,
      storeId: decodedToken.storeId,
      permissions: decodedToken.permissions
    } : null

    console.log('🔑 auth.ts - authenticateSessionCookie - Claims extracted:', claims)

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      claims
    }
  } catch (error: any) {
    console.error('❌ auth.ts - authenticateSessionCookie - Error verifying session cookie:', error)

    // Si el usuario no existe, la session cookie es inválida
    if (error.code === 'auth/user-not-found' ||
        error.message?.includes('no user record corresponding')) {
      console.log('⚠️ auth.ts - authenticateSessionCookie - Session cookie references deleted user, should be cleared')
    }

    return null
  }
}

// Require authentication with session cookie and custom claims
export async function requireSessionAuth(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
  claims: CustomClaims
} | null> {
  const authData = await authenticateSessionCookie(request)

  if (!authData || !authData.claims || !authData.claims.apiAccess) {
    return null
  }

  return {
    uid: authData.uid,
    email: authData.email,
    name: authData.name,
    claims: authData.claims
  }
}

// Flexible authentication: try session cookie first, then fallback to JWT token
export async function authenticateFlexible(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
  claims: CustomClaims | null
  method: 'session' | 'token'
} | null> {
  // Try session cookie first (preferred)
  const sessionAuth = await authenticateSessionCookie(request)
  if (sessionAuth) {
    return {
      ...sessionAuth,
      method: 'session'
    }
  }

  // Fallback to JWT token
  const tokenAuth = await authenticateFirebaseToken(request)
  if (tokenAuth) {
    return {
      ...tokenAuth,
      method: 'token'
    }
  }

  return null
}

// Admin API Key Authentication (for backend admin)
export function authenticateAdminApiKey(request: NextRequest): {
  uid: string
  email: string
  name: string
  claims: CustomClaims
  method: 'admin_api'
} | null {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.API_SECRET_KEY

  if (!expectedApiKey) {
    console.log('❌ authenticateAdminApiKey - API_SECRET_KEY not configured')
    return null
  }

  if (apiKey === expectedApiKey) {
    console.log('✅ authenticateAdminApiKey - Admin API key validated')
    return {
      uid: 'admin',
      email: 'admin@pdt.com',
      name: 'Admin',
      claims: {
        role: 'admin',
        apiAccess: true,
        customerId: undefined,
        storeId: undefined,
        permissions: undefined
      },
      method: 'admin_api'
    }
  }

  console.log('❌ authenticateAdminApiKey - Invalid API key')
  return null
}

// Require flexible authentication with custom claims (includes admin API key bypass)
export async function requireFlexibleAuth(request: NextRequest): Promise<{
  uid: string
  email?: string
  name?: string
  claims: CustomClaims
  method: 'session' | 'token' | 'admin_api'
} | null> {
  console.log('🔐 requireFlexibleAuth - Starting authentication check')

  // First try admin API key bypass
  const adminAuth = authenticateAdminApiKey(request)
  if (adminAuth) {
    console.log('✅ requireFlexibleAuth - Admin API key authentication successful')
    return adminAuth
  }

  // Then try flexible auth (session + token)
  const authData = await authenticateFlexible(request)

  console.log('🔐 requireFlexibleAuth - Auth data received:', {
    hasAuthData: !!authData,
    hasClaims: !!authData?.claims,
    hasApiAccess: !!authData?.claims?.apiAccess,
    method: authData?.method,
    uid: authData?.uid,
    claims: authData?.claims
  })

  if (!authData) {
    console.log('❌ requireFlexibleAuth - No auth data')
    return null
  }

  if (!authData.claims) {
    console.log('❌ requireFlexibleAuth - No claims in auth data')
    return null
  }

  if (!authData.claims.apiAccess) {
    console.log('❌ requireFlexibleAuth - apiAccess is false or missing:', authData.claims.apiAccess)
    return null
  }

  console.log('✅ requireFlexibleAuth - Authentication successful')

  return {
    uid: authData.uid,
    email: authData.email,
    name: authData.name,
    claims: authData.claims,
    method: authData.method
  }
}

// Helper to check if user has required role
export function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

// Middleware to require specific roles
export function requireRoles(allowedRoles: UserRole[]) {
  return (userRole: UserRole): boolean => {
    return hasRequiredRole(userRole, allowedRoles)
  }
}