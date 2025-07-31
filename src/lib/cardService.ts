import { db, COLLECTIONS } from './firebase'
import { Card, CreateCardRequest } from '@/types/card'
import { DocumentReference } from 'firebase-admin/firestore'

export class CardService {
  static async createCard(cardData: CreateCardRequest): Promise<Card> {
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
  }

  static async getCardByCertificationNumber(certificationNumber: number): Promise<Card | null> {
    const collection = db.collection(COLLECTIONS.CARDS)
    const snapshot = await collection
      .where('certificationNumber', '==', certificationNumber)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return doc.data() as Card
  }

  static async getAllCards(limit = 20, offset = 0, sort: 'asc' | 'desc' | null = null): Promise<{ cards: Card[], total: number }> {
    const collection = db.collection(COLLECTIONS.CARDS)
    
    const countSnapshot = await collection.count().get()
    const total = countSnapshot.data().count

    let query = collection.orderBy('createdAt', 'desc')

    if (sort) {
      query = collection.orderBy('certificationNumber', sort)
    }

    const snapshot = await query
      .offset(offset)
      .limit(limit)
      .get()

    const cards = snapshot.docs.map(doc => doc.data() as Card)

    return { cards, total }
  }

  static async updateCard(certificationNumber: number, updates: Partial<CreateCardRequest & { images?: string[] }>): Promise<Card> {
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

    const docRef = db.collection(COLLECTIONS.CARDS).doc(existingCard.data.documentId)
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
    await docRef.delete()
  }
}