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
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig