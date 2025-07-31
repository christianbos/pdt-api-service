import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'demo-key',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'demo@demo.com',
  }),
}

if (getApps().length === 0) {
  initializeApp(firebaseAdminConfig)
}

export const db = getFirestore()

export const COLLECTIONS = {
  CARDS: 'cards',
} as const