// Utilidades para generar URLs de Firebase Storage en el cliente
// Compatible con la estructura de archivos del servidor Firebase Storage

export function generateFirebaseStorageUrl(
  filePath: string,
  downloadToken?: string
): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pdt-baclen'
  const encodedPath = encodeURIComponent(filePath)
  
  if (downloadToken) {
    return `https://firebasestorage.googleapis.com/v0/b/${projectId}.firebasestorage.app/o/${encodedPath}?alt=media&token=${downloadToken}`
  }
  
  return `https://firebasestorage.googleapis.com/v0/b/${projectId}.firebasestorage.app/o/${encodedPath}?alt=media`
}

export function generateThumbnailUrl(publicId: string): string {
  // Nueva estructura: todos los thumbnails en carpeta thumbnails/ raíz
  // Formato: thumbnails/{certNumber}_{imageType}.webp
  
  if (publicId.includes('cards/') && !publicId.includes('thumbnails/')) {
    let certNumber: string
    let imageType: string
    
    if (publicId.includes('/full/')) {
      // Para carta_frente/atras en cards/{id}/full/
      // Formato: cards/15/full/15_carta_frente.webp
      const fileName = publicId.split('/').pop()?.replace('.webp', '') || ''
      const parts = fileName.split('_')
      certNumber = parts[0] || ''
      imageType = parts.slice(1).join('_') || ''
    } else {
      // Para otras imágenes en cards/{certNumber}/
      // Formato: cards/15/esquina_frente_topLeft.webp  
      const parts = publicId.split('/')
      certNumber = parts[1] || ''
      const fileName = parts.pop()?.replace('.webp', '') || ''
      imageType = fileName
    }
    
    // Generar ruta del thumbnail en thumbnails/
    const thumbPath = `thumbnails/${certNumber}_${imageType}.webp`
    return generateFirebaseStorageUrl(thumbPath)
  }
  
  return generateFirebaseStorageUrl(publicId)
}

export function generateMediumUrl(publicId: string): string {
  // Por ahora Firebase Storage no tiene transformaciones automáticas
  // Retorna la URL original (luego se puede implementar con Cloud Functions)
  return generateFirebaseStorageUrl(publicId)
}

export function generateOriginalUrl(publicId: string): string {
  return generateFirebaseStorageUrl(publicId)
}

// Función helper para determinar si una URL es de Firebase Storage
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com')
}

// Función para obtener el path del archivo desde una URL de Firebase Storage
export function extractPathFromFirebaseUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/o/')[1]?.split('?')[0]
    return decodeURIComponent(path || '')
  } catch {
    return ''
  }
}