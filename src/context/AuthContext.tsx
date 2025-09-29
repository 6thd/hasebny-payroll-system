"use client";

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type AppUser } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { checkFirebaseConnection, checkNetworkConnectivity } from '@/lib/firebase-utils';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  error: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider: Initializing authentication");
    
    // Check network connectivity first
    if (!checkNetworkConnectivity()) {
      console.log("AuthProvider: No network connectivity");
      setError("لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك بالشبكة.");
      setLoading(false);
      return;
    }

    let unsubscribe: () => void;
    
    const initAuth = async () => {
      try {
        // Check Firebase connection
        console.log("AuthProvider: Checking Firebase connection");
        const connectionCheck = await checkFirebaseConnection();
        if (!connectionCheck.success) {
          console.log("AuthProvider: Firebase connection failed");
          setError(`فشل الاتصال بقاعدة البيانات: ${connectionCheck.error}`);
          setLoading(false);
          return;
        }
        
        console.log("AuthProvider: Firebase connection successful");
        
        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          console.log("AuthProvider: Auth state changed", firebaseUser ? "User logged in" : "No user");
          
          if (firebaseUser) {
            try {
              const q = query(collection(db, "employees"), where("authUid", "==", firebaseUser.uid));
              const querySnapshot = await getDocs(q);

              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = {
                  ...firebaseUser,
                  ...userDoc.data(),
                  id: userDoc.id,
                } as AppUser;
                console.log("AuthProvider: User data loaded", userData.id);
                setUser(userData);
              } else {
                console.log("AuthProvider: No employee record found for user");
                setUser(null);
                setError("لم يتم العثور على سجل موظف مرتبط بحسابك.");
              }
            } catch (err: any) {
              console.error("AuthProvider: Error fetching user data", err);
              setError(`خطأ في جلب بيانات المستخدم: ${err.message}`);
            }
          } else {
            console.log("AuthProvider: No authenticated user");
            setUser(null);
          }
          setLoading(false);
        });
      } catch (err: any) {
        console.error("AuthProvider: Initialization error", err);
        setError(`خطأ في تهيئة المصادقة: ${err.message}`);
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log("AuthProvider: Cleaning up auth listener");
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    console.log("AuthProvider: Showing loading spinner");
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    console.log("AuthProvider: Showing error", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-6 max-w-md w-full space-y-4 text-center">
          <h2 className="text-2xl font-bold text-destructive">خطأ في الاتصال</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error: null }}>
      {children}
    </AuthContext.Provider>
  );
}