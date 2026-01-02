import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

// Waits for anonymous auth to be ready (AuthProvider handles signInAnonymously)
export function useAuthReady(): {
  user: User | null;
  isReady: boolean;
} {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [isReady, setIsReady] = useState(() => !!auth.currentUser);

  useEffect(() => {
    let isMounted = true;

    if (auth.currentUser && isMounted) {
      setUser(auth.currentUser);
      setIsReady(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      if (!isMounted) return;
      if (currentUser) {
        setUser(currentUser);
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { user, isReady };
}

