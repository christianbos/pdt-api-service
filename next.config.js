/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para manejar archivos grandes en API routes
  serverExternalPackages: ['sharp'],
  
  // Request timeout and memory optimizations
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'X-Request-Timeout',
            value: '300' // 5 minutes timeout
          },
          // CORS headers para permitir requests desde frontend
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? 'http://localhost:3001' 
              : (process.env.FRONTEND_URL || 'https://pdtgrading.com')
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig