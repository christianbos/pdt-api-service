import { db, COLLECTIONS, cleanupFirebaseConnection } from './firebase'
import { Card, CreateCardRequest, CardImages, ImageType, ImageMetadata } from '@/types/card'
import { DocumentReference } from 'firebase-admin/firestore'

export class CardService {
  static async createCard(cardData: CreateCardRequest): Promise<Card> {
    try {
      const collection = db.collection(COLLECTIONS.CARDS)
      
      const exists = await this.getCardByCertificationNumber(cardData.certificationNumber)
      if (exists) {
        throw new Error(`Card with certification number ${cardData.certificationNumber} already exists`)
      }

      const docRef = await collection.add({
        ...cardData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        locale: null,
        documentId: '',
      })

      await docRef.update({ documentId: docRef.id })

      const doc = await docRef.get()
      return doc.data() as Card
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getCardByCertificationNumber(certificationNumber: number): Promise<Card | null> {
    try {
      console.log(`🔍 [CardService] Fetching card with certification number: ${certificationNumber}`)
      console.log(`🔍 [CardService] Firebase project: ${process.env.FIREBASE_PROJECT_ID}`)
      console.log(`🔍 [CardService] Environment: ${process.env.NODE_ENV}`)
      
      const collection = db.collection(COLLECTIONS.CARDS)
      const snapshot = await collection
        .where('certificationNumber', '==', certificationNumber)
        .limit(1)
        .get()

      console.log(`📊 [CardService] Query executed, empty: ${snapshot.empty}, docs count: ${snapshot.docs.length}`)

      if (snapshot.empty) {
        console.log(`❌ [CardService] No card found with certification number: ${certificationNumber}`)
        return null
      }

      const doc = snapshot.docs[0]
      const cardData = doc.data() as Card
      console.log(`✅ [CardService] Card found: ${cardData.certificationNumber}, images:`, !!cardData.images)
      if (cardData.images) {
        console.log(`🖼️  [CardService] Image URLs:`, JSON.stringify(cardData.images, null, 2))
      }
      
      return cardData
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getAllCards(limit = 20, offset = 0, sort: 'asc' | 'desc' | null = 'desc'): Promise<{ cards: Card[], total: number }> {
    try {
      const collection = db.collection(COLLECTIONS.CARDS)

      const countSnapshot = await collection.count().get()
      const total = countSnapshot.data().count

      let query = collection.orderBy('certificationNumber', sort || 'desc')

      const snapshot = await query
        .offset(offset)
        .limit(limit)
        .get()

      const cards = snapshot.docs.map(doc => doc.data() as Card)

      return { cards, total }
    } finally {
      cleanupFirebaseConnection()
    }
  }

  // Las cartas ahora se obtienen a través de las órdenes
  // Para obtener cartas de un cliente: buscar sus órdenes y luego las cartas de cada orden

  static async updateCard(certificationNumber: number, updates: Partial<CreateCardRequest & { images?: CardImages | string[] }>): Promise<Card> {
    const existingCard = await this.getCardByCertificationNumber(certificationNumber)
    if (!existingCard) {
      throw new Error(`Card with certification number ${certificationNumber} not found`)
    }

    if (updates.certificationNumber && updates.certificationNumber !== certificationNumber) {
      const existsWithNewNumber = await this.getCardByCertificationNumber(updates.certificationNumber)
      if (existsWithNewNumber) {
        throw new Error(`Card with certification number ${updates.certificationNumber} already exists`)
      }
    }

    const docRef = db.collection(COLLECTIONS.CARDS).doc(existingCard.documentId)
    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    const updatedDoc = await docRef.get()
    return updatedDoc.data() as Card
  }

  static async deleteCard(certificationNumber: number): Promise<void> {
    const existingCard = await this.getCardByCertificationNumber(certificationNumber)
    if (!existingCard) {
      throw new Error(`Card with certification number ${certificationNumber} not found`)
    }

    const docRef = db.collection(COLLECTIONS.CARDS).doc(existingCard.documentId)
    
    // Eliminar subcollection de imágenes si existe
    const imagesRef = docRef.collection('images')
    const imagesSnapshot = await imagesRef.get()
    
    if (!imagesSnapshot.empty) {
      const batch = db.batch()
      imagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()
    }
    
    await docRef.delete()
  }

  // Image-specific methods
  static async getCardImages(certificationNumber: number): Promise<CardImages | null> {
    const card = await this.getCardByCertificationNumber(certificationNumber)
    return card?.images || null
  }

  static async getCardImageByType(certificationNumber: number, imageType: ImageType): Promise<ImageMetadata | null> {
    const images = await this.getCardImages(certificationNumber)
    if (!images) return null

    const isMain = ['front', 'back'].includes(imageType)
    const category = isMain ? 'main' : 'specialized'
    
    if (category === 'main') {
      return images.main?.[imageType as keyof typeof images.main] || null
    } else {
      return images.specialized?.[imageType as keyof typeof images.specialized] || null
    }
  }

  static async updateCardImage(certificationNumber: number, imageType: ImageType, metadata: ImageMetadata): Promise<void> {
    const existingCard = await this.getCardByCertificationNumber(certificationNumber)
    if (!existingCard) {
      throw new Error(`Card with certification number ${certificationNumber} not found`)
    }

    const isMain = ['front', 'back'].includes(imageType)
    const category = isMain ? 'main' : 'specialized'
    
    const currentImages = existingCard.images || { main: {}, specialized: {} }
    
    if (category === 'main') {
      if (!currentImages.main) {
        currentImages.main = {}
      }
      currentImages.main[imageType as keyof typeof currentImages.main] = metadata
    } else {
      if (!currentImages.specialized) {
        currentImages.specialized = {}
      }
      currentImages.specialized[imageType as keyof typeof currentImages.specialized] = metadata
    }

    await this.updateCard(certificationNumber, { images: currentImages })
  }

  static async removeCardImage(certificationNumber: number, imageType: ImageType): Promise<void> {
    const existingCard = await this.getCardByCertificationNumber(certificationNumber)
    if (!existingCard) {
      throw new Error(`Card with certification number ${certificationNumber} not found`)
    }

    const isMain = ['front', 'back'].includes(imageType)
    const category = isMain ? 'main' : 'specialized'
    
    const currentImages = existingCard.images
    if (!currentImages) return
    
    if (category === 'main') {
      const key = imageType as keyof typeof currentImages.main
      if (!currentImages.main?.[key]) return
      delete currentImages.main[key]
    } else {
      const key = imageType as keyof typeof currentImages.specialized
      if (!currentImages.specialized?.[key]) return
      delete currentImages.specialized[key]
    }
    
    if (category === 'main' && currentImages.main && Object.keys(currentImages.main).length === 0) {
      delete currentImages.main
    } else if (category === 'specialized' && currentImages.specialized && Object.keys(currentImages.specialized).length === 0) {
      delete currentImages.specialized
    }

    const updatedImages = Object.keys(currentImages).length > 0 ? currentImages : undefined
    await this.updateCard(certificationNumber, { images: updatedImages as any })
  }

  static async getCardsByImageType(imageType: ImageType, limit = 20): Promise<Card[]> {
    const collection = db.collection(COLLECTIONS.CARDS)
    const isMain = ['front', 'back'].includes(imageType)
    const category = isMain ? 'main' : 'specialized'
    
    const snapshot = await collection
      .where(`images.${category}.${imageType}`, '!=', null)
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => doc.data() as Card)
  }

  // Corner-specific methods
  static async getCardCornerImages(certificationNumber: number, side: 'front' | 'back' = 'front'): Promise<Record<string, ImageMetadata | null>> {
    const images = await this.getCardImages(certificationNumber)
    if (!images?.specialized) return { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null }

    const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']
    const result: Record<string, ImageMetadata | null> = {}
    
    corners.forEach(corner => {
      const imageType = `${side}_corner_${corner}` as ImageType
      const key = imageType as keyof typeof images.specialized
      result[corner] = images.specialized?.[key] || null
    })
    
    return result
  }

  static async updateCardCornerImage(
    certificationNumber: number, 
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight',
    side: 'front' | 'back' = 'front',
    metadata: ImageMetadata
  ): Promise<void> {
    const imageType = `${side}_corner_${corner}` as ImageType
    await this.updateCardImage(certificationNumber, imageType, metadata)
  }

  static async removeCardCornerImage(
    certificationNumber: number,
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', 
    side: 'front' | 'back' = 'front'
  ): Promise<void> {
    const imageType = `${side}_corner_${corner}` as ImageType
    await this.removeCardImage(certificationNumber, imageType)
  }

  static async getCardsWithCompleteCorners(side: 'front' | 'back' = 'front', limit = 20): Promise<Card[]> {
    const collection = db.collection(COLLECTIONS.CARDS)
    const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']
    
    const cornerQueries = corners.map(corner => {
      const imageType = `${side}_corner_${corner}`
      return collection.where(`images.specialized.${imageType}`, '!=', null)
    })
    
    const snapshot = await cornerQueries[0].limit(limit).get()
    const cards = snapshot.docs.map(doc => doc.data() as Card)
    
    return cards.filter(card => {
      if (!card.images?.specialized) return false
      
      return corners.every(corner => {
        const imageType = `${side}_corner_${corner}` as ImageType
        const key = imageType as keyof typeof card.images.specialized
        return card.images?.specialized?.[key]
      })
    })
  }
}
