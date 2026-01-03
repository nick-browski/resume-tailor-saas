import React, { useEffect, useState } from "react";
import { auth } from "@/shared/config";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

const INITIAL_LOADER_ID = "initial-loader";

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        // Auto-sign in anonymously if no user
        try {
          await signInAnonymously(auth);
          return;
        } catch (error) {
          console.error("Failed to sign in anonymously:", error);
          setIsInitialized(true);
          hideInitialLoader();
          return;
        }
      }
      setIsInitialized(true);
      hideInitialLoader();
    });

    return () => unsubscribe();
  }, []);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}

function hideInitialLoader() {
  const initialLoader = document.getElementById(INITIAL_LOADER_ID);
  if (initialLoader) {
    initialLoader.classList.add("hidden");
  }
}
