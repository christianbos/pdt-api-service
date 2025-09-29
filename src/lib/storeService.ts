import { db, COLLECTIONS, cleanupFirebaseConnection } from './firebase'
import { Store, CreateStoreRequest } from '@/types/store'

export class StoreService {
  static async createStore(storeData: CreateStoreRequest): Promise<Store> {
    try {
      const collection = db.collection(COLLECTIONS.STORES)
      
      const docRef = await collection.add({
        ...storeData,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentId: '',
      })

      await docRef.update({ documentId: docRef.id })

      const doc = await docRef.get()
      return doc.data() as Store
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getStoreById(documentId: string): Promise<Store | null> {
    try {
      const docRef = db.collection(COLLECTIONS.STORES).doc(documentId)
      const doc = await docRef.get()
      
      if (!doc.exists) return null
      
      return doc.data() as Store
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async getAllStores(limit = 20, offset = 0): Promise<{ stores: Store[], total: number }> {
    try {
      const collection = db.collection(COLLECTIONS.STORES)
      
      const countSnapshot = await collection.count().get()
      const total = countSnapshot.data().count

      const snapshot = await collection
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get()

      const stores = snapshot.docs.map(doc => doc.data() as Store)

      return { stores, total }
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async updateStore(documentId: string, updates: Partial<CreateStoreRequest>): Promise<Store> {
    try {
      const existingStore = await this.getStoreById(documentId)
      if (!existingStore) {
        throw new Error(`Store with ID ${documentId} not found`)
      }

      const docRef = db.collection(COLLECTIONS.STORES).doc(documentId)
      await docRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })

      const updatedDoc = await docRef.get()
      return updatedDoc.data() as Store
    } finally {
      cleanupFirebaseConnection()
    }
  }

  static async deleteStore(documentId: string): Promise<void> {
    try {
      const existingStore = await this.getStoreById(documentId)
      if (!existingStore) {
        throw new Error(`Store with ID ${documentId} not found`)
      }

      const docRef = db.collection(COLLECTIONS.STORES).doc(documentId)
      await docRef.delete()
    } finally {
      cleanupFirebaseConnection()
    }
  }
}