import { ImageType } from '@/types/card'

export class ImageValidationService {
  /**
   * Validar si el tipo de imagen es válido
   */
  static validateImageType(imageType: string): imageType is ImageType {
    const validTypes: ImageType[] = [
      'front', 'back', 
      'front_corners', 'back_corners',
      'front_corner_topLeft', 'front_corner_topRight',
      'front_corner_bottomLeft', 'front_corner_bottomRight',
      'back_corner_topLeft', 'back_corner_topRight',
      'back_corner_bottomLeft', 'back_corner_bottomRight',
      'front_edges', 'back_edges',
      'front_surface', 'back_surface'
    ]
    return validTypes.includes(imageType as ImageType)
  }

  /**
   * Determinar si una imagen es de categoría main o specialized
   */
  static getImageCategory(imageType: ImageType): 'main' | 'specialized' {
    const main: ImageType[] = ['front', 'back']
    return main.includes(imageType) ? 'main' : 'specialized'
  }

  /**
   * Obtener todos los tipos de imagen válidos
   */
  static getAllValidImageTypes(): ImageType[] {
    return [
      'front', 'back', 
      'front_corners', 'back_corners',
      'front_corner_topLeft', 'front_corner_topRight',
      'front_corner_bottomLeft', 'front_corner_bottomRight',
      'back_corner_topLeft', 'back_corner_topRight',
      'back_corner_bottomLeft', 'back_corner_bottomRight',
      'front_edges', 'back_edges',
      'front_surface', 'back_surface'
    ]
  }
}