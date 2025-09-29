import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'demo-key',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'demo@demo.com',
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'demo-project'}.firebasestorage.app`
}

// Initialize Firebase only once
if (getApps().length === 0) {
  initializeApp(firebaseAdminConfig)
}

// Get Firestore instance (initialized once)
const db = getFirestore()

// Configure settings only once, right after initialization
try {
  db.settings({
    ignoreUndefinedProperties: true,
  })
} catch (error) {
  // Settings already configured, ignore error
  console.log('Firestore settings already configured')
}

// Simple cleanup function for memory management
export function cleanupFirebaseConnection() {
  // Force garbage collection periodically if available
  if (global.gc) {
    setImmediate(() => global.gc!())
  }
}

export { db }

export const COLLECTIONS = {
  CARDS: 'cards',
  ORDERS: 'orders',
  STORES: 'stores',
  CUSTOMERS: 'customers',
  COUNTERS: 'counters',
  USERS: 'users',
} as const