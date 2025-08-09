import { getStorage } from 'firebase-admin/storage'
import { v4 as uuidv4 } from 'uuid'
import { ImageType } from '@/types/card'
import './firebase' // Asegurar que Firebase se inicialice antes de usar Storage

export interface FirebaseUploadResponse {
  publicUrl: string
  fileName: string
  path: string
  size: number
}

export interface FirebaseImageMetadata {
  publicId: string
  url: string
  width?: number
  height?: number
  format: string
  size: number
  uploadedAt: string
}

export class FirebaseStorageService {
  private static bucket = getStorage().bucket()

  /**
   * Generar path para archivo en Firebase Storage
   */
  static generateFilePath(certificationNumber: number, imageType: ImageType, isThumb = false): string {
    if (isThumb) {
      // All thumbnails go to the root thumbnails/ folder
      return `thumbnails/${certificationNumber}_${imageType}.webp`
    }
    
    // Main images (front, back) go to cards/{id}/full/
    if (imageType === 'front' || imageType === 'back') {
      return `cards/${certificationNumber}/full/${certificationNumber}_${imageType}.webp`
    }
    
    // Other images go to cards/{certificationNumber}/
    return `cards/${certificationNumber}/${imageType}.webp`
  }

  /**
   * Subir archivo a Firebase Storage
   */
  static async uploadImage(
    buffer: Buffer,
    certificationNumber: number,
    imageType: ImageType,
    originalFileName?: string
  ): Promise<FirebaseUploadResponse> {
    let filePath: string | undefined;
    try {
      filePath = this.generateFilePath(certificationNumber, imageType)
      const file = this.bucket.file(filePath)

      // Detectar tipo de contenido basado en el nombre original o usar webp por defecto
      const contentType = this.getContentType(originalFileName) || 'image/webp'
      
      // Generar token de acceso público
      const downloadToken = uuidv4()

      const metadata = {
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalName: originalFileName || `${imageType}.webp`,
          certificationNumber: certificationNumber.toString(),
          imageType,
          uploadedAt: new Date().toISOString()
        },
        contentType,
        cacheControl: 'public, max-age=31536000', // 1 año
      }

      // Subir archivo
      await file.save(buffer, {
        metadata,
        resumable: false, // Para archivos pequeños es más eficiente
        validation: 'crc32c'
      })

      // Generar URL pública
      const publicUrl = this.getPublicUrl(filePath, downloadToken)

      return {
        publicUrl,
        fileName: filePath.split('/').pop() || '',
        path: filePath,
        size: buffer.length
      }

    } catch (error) {
      console.error('Error uploading to Firebase Storage:', error)
      console.error('Firebase Storage debug:', {
        projectId: process.env.FIREBASE_PROJECT_ID,
        bucketName: this.bucket.name,
        filePath
      })
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generar URL pública para acceso directo
   */
  static getPublicUrl(filePath: string, downloadToken?: string): string {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const encodedPath = encodeURIComponent(filePath)
    
    if (downloadToken) {
      return `https://firebasestorage.googleapis.com/v0/b/${projectId}.firebasestorage.app/o/${encodedPath}?alt=media&token=${downloadToken}`
    }
    
    return `https://firebasestorage.googleapis.com/v0/b/${projectId}.firebasestorage.app/o/${encodedPath}?alt=media`
  }

  /**
   * Obtener URL de thumbnail
   */
  static getThumbnailUrl(certificationNumber: number, imageType: ImageType): string {
    const thumbPath = this.generateFilePath(certificationNumber, imageType, true)
    return this.getPublicUrl(thumbPath)
  }

  /**
   * Obtener URLs responsivas (original y thumbnail)
   */
  static getResponsiveUrls(certificationNumber: number, imageType: ImageType) {
    return {
      original: this.getPublicUrl(this.generateFilePath(certificationNumber, imageType)),
      thumbnail: this.getThumbnailUrl(certificationNumber, imageType),
      medium: this.getPublicUrl(this.generateFilePath(certificationNumber, imageType)), // Por ahora igual que original
      large: this.getPublicUrl(this.generateFilePath(certificationNumber, imageType))   // Por ahora igual que original
    }
  }

  /**
   * Eliminar imagen de Firebase Storage
   */
  static async deleteImage(certificationNumber: number, imageType: ImageType): Promise<void> {
    try {
      const filePath = this.generateFilePath(certificationNumber, imageType)
      const thumbPath = this.generateFilePath(certificationNumber, imageType, true)

      // Eliminar imagen original
      await this.bucket.file(filePath).delete({ ignoreNotFound: true })
      
      // Eliminar thumbnail si existe
      await this.bucket.file(thumbPath).delete({ ignoreNotFound: true })

      console.log(`Deleted images: ${filePath}, ${thumbPath}`)
    } catch (error) {
      console.error('Error deleting from Firebase Storage:', error)
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Eliminar todas las imágenes de una carta
   */
  static async deleteCardImages(certificationNumber: number): Promise<void> {
    try {
      // Buscar archivos en múltiples ubicaciones
      const prefixes = [
        `cards/${certificationNumber}/`,  // Todas las imágenes (incluye /full/)
        `thumbnails/${certificationNumber}_`  // Thumbnails
      ]

      const allFiles: any[] = []
      
      for (const prefix of prefixes) {
        const [files] = await this.bucket.getFiles({ prefix })
        allFiles.push(...files)
      }

      if (allFiles.length === 0) {
        console.log(`No images found for card ${certificationNumber}`)
        return
      }

      // Eliminar todos los archivos en paralelo
      await Promise.all(allFiles.map(file => file.delete({ ignoreNotFound: true })))
      
      console.log(`Deleted ${allFiles.length} images for card ${certificationNumber}`)
    } catch (error) {
      console.error('Error deleting card images:', error)
      throw new Error(`Failed to delete card images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verificar si existe una imagen
   */
  static async imageExists(certificationNumber: number, imageType: ImageType): Promise<boolean> {
    try {
      const filePath = this.generateFilePath(certificationNumber, imageType)
      const [exists] = await this.bucket.file(filePath).exists()
      return exists
    } catch (error) {
      console.error('Error checking image existence:', error)
      return false
    }
  }

  /**
   * Obtener metadata de una imagen
   */
  static async getImageMetadata(certificationNumber: number, imageType: ImageType): Promise<FirebaseImageMetadata | null> {
    try {
      const filePath = this.generateFilePath(certificationNumber, imageType)
      const file = this.bucket.file(filePath)
      
      const [metadata] = await file.getMetadata()
      
      if (!metadata) return null

      const downloadToken = metadata.metadata?.firebaseStorageDownloadTokens as string | undefined
      const publicUrl = this.getPublicUrl(filePath, downloadToken)

      return {
        publicId: filePath,
        url: publicUrl,
        format: metadata.contentType?.split('/')[1] || 'webp',
        size: parseInt(String(metadata.size || '0')),
        uploadedAt: String(metadata.metadata?.uploadedAt || metadata.timeCreated || new Date().toISOString())
      }
    } catch (error) {
      console.error('Error getting image metadata:', error)
      return null
    }
  }

  /**
   * Detectar tipo de contenido del archivo
   */
  private static getContentType(fileName?: string): string | undefined {
    if (!fileName) return undefined

    const ext = fileName.toLowerCase().split('.').pop()
    const types: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    }

    return types[ext || '']
  }

  /**
   * Generar nombre único para evitar colisiones
   */
  static generateUniqueFileName(imageType: ImageType, originalName?: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const ext = originalName ? originalName.split('.').pop() : 'webp'
    return `${imageType}_${timestamp}_${random}.${ext}`
  }
}