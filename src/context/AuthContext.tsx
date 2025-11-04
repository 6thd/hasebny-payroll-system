'use client';

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth, db } from '@/lib/firebase/client';
import { type AppUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

const queryClient = new QueryClient();

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'employees', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let firestoreData: any = null;
        let docId: string | null = null;

        if (userDocSnap.exists()) {
          firestoreData = userDocSnap.data();
          docId = userDocSnap.id;
        } else {
          const q = query(collection(db, "employees"), where("authUid", "==", firebaseUser.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            firestoreData = userDoc.data();
            docId = userDoc.id;
          }
        }

        if (firestoreData && docId) {
          const appUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: firestoreData.role || 'employee',
            name: firestoreData.name,
            id: docId,
            jobTitle: firestoreData.jobTitle, 
            department: firestoreData.department,
          };
          setUser(appUser);
        } else {
          setUser(null);
          await auth.signOut();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      if (!user && !isAuthPage) {
        router.push('/login');
      }
      if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // While loading, or if redirecting a non-authenticated user, show a spinner or nothing.
  if (loading) {
    return <LoadingSpinner />;
  }

  // If user is not authenticated and on a protected page, a redirect is in progress.
  // Render null to avoid flashing content.
  if (!user && !isAuthPage) {
    return null;
  }

  // User is authenticated, or on an auth page. Render the children.
  return (
    <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AuthContext.Provider value={{ user, loading }}>
            {children}
          </AuthContext.Provider>
        </SessionProvider>
    </QueryClientProvider>
  );
}
