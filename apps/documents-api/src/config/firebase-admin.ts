import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth as getFirebaseAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import {
  getStorage as getFirebaseStorage,
  Storage,
} from "firebase-admin/storage";
import { FIREBASE_CONFIG, ERROR_MESSAGES } from "./constants.js";

let app: App | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: Storage | null = null;

// Initializes Firebase Admin SDK for emulator or production mode
export function initializeFirebaseAdmin() {
  if (app && authInstance && dbInstance && storageInstance) {
    return;
  }

  const isEmulatorMode =
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  if (isEmulatorMode) {
    if (getApps().length === 0) {
      const projectId =
        process.env.FIREBASE_PROJECT_ID || FIREBASE_CONFIG.DEFAULT_PROJECT_ID;
      app = initializeApp({
        projectId,
        storageBucket: `${projectId}.appspot.com`,
      });
    } else {
      app = getApps()[0];
    }

    authInstance = getFirebaseAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getFirebaseStorage(app);
  } else {
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

      if (!serviceAccountKey) {
        throw new Error(ERROR_MESSAGES.SERVICE_ACCOUNT_KEY_REQUIRED);
      }

      app = initializeApp({
        credential: cert(serviceAccountKey),
      });
    } else {
      app = getApps()[0];
    }

    authInstance = getFirebaseAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getFirebaseStorage(app);
  }
}

// Returns Firebase Auth instance, initializes if needed
export function getAuth(): Auth {
  if (!authInstance) {
    initializeFirebaseAdmin();
  }
  return authInstance!;
}

// Returns Firestore instance, initializes if needed
export function getDb(): Firestore {
  if (!dbInstance) {
    initializeFirebaseAdmin();
  }
  return dbInstance!;
}

// Returns Firebase Storage instance, initializes if needed
export function getStorage(): Storage {
  if (!storageInstance) {
    initializeFirebaseAdmin();
  }
  return storageInstance!;
}
