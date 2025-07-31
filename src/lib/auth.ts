import { NextRequest } from 'next/server'

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