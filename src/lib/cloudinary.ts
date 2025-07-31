import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
}

export class CloudinaryService {
  static async uploadImage(
    buffer: Buffer,
    certificationNumber: number,
    fileName: string
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `pdt-cards/${certificationNumber}`,
          public_id: `${certificationNumber}_${fileName}`,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto:good',
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      )

      uploadStream.end(buffer)
    })
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error)
      throw error
    }
  }

  static async deleteFolder(certificationNumber: number): Promise<void> {
    try {
      await cloudinary.api.delete_folder(`pdt-cards/${certificationNumber}`)
    } catch (error) {
      console.error('Error deleting folder from Cloudinary:', error)
    }
  }
}

export default cloudinary