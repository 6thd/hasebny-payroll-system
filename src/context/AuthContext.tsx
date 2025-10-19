"use client";

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'employees', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data(), id: userDoc.id } as AppUser);
        } else {
            // This case might happen if user exists in Auth but not in Firestore employees collection.
            // For now, we treat them as not fully logged in.
            const q = query(collection(db, "employees"), where("authUid", "==", firebaseUser.uid));
            const querySnapshot = await getDocs(q);
            if(!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = {
                    ...firebaseUser,
                    ...userDoc.data(),
                    id: userDoc.id,
                } as AppUser;
                setUser(userData);
            } else {
                setUser(null);
            }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
