import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    // Set CORS headers for preflight
    const origin = request.headers.get('origin')
    const allowedOrigins = process.env.NODE_ENV === 'development'
      ? ['http://localhost:3001', 'http://localhost:3000']
      : [process.env.FRONTEND_URL || 'https://pdtgrading.com']
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    
    return response
  }

  // For non-OPTIONS requests, continue with normal processing
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}