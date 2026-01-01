import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from "firebase/storage";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Connect to emulators in development mode
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

if (useEmulator) {
  const authEmulatorHost =
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || "http://localhost:9099";
  const firestoreEmulatorHost =
    import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "localhost";
  const firestoreEmulatorPort = parseInt(
    import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || "8082",
    10
  );
  const storageEmulatorHost =
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "localhost";
  const storageEmulatorPort = parseInt(
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || "9199",
    10
  );

  try {
    connectAuthEmulator(auth, authEmulatorHost, { disableWarnings: true });
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("already connected")
    ) {
      console.warn("Failed to connect Auth emulator:", error);
    }
  }

  try {
    connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("already connected")
    ) {
      console.warn("Failed to connect Firestore emulator:", error);
    }
  }

  try {
    connectStorageEmulator(storage, storageEmulatorHost, storageEmulatorPort);
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("already connected")
    ) {
      console.warn("Failed to connect Storage emulator:", error);
    }
  }
}

export default app;
