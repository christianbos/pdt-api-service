/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para manejar archivos grandes en API routes
  serverExternalPackages: ['sharp'],
}

module.exports = nextConfig