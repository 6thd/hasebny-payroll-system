"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "./LoadingSpinner";

// Debug flag - set to true to bypass authentication for testing
const DEBUG_MODE = false;

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  // If in debug mode, bypass authentication
  if (DEBUG_MODE) {
    console.log("AppShell: DEBUG MODE - bypassing authentication");
    return <>{children}</>;
  }

  // Handle authentication errors
  if (error) {
    console.log("AppShell: Authentication error", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-6 max-w-md w-full space-y-4 text-center">
          <h2 className="text-2xl font-bold text-destructive">خطأ في المصادقة</h2>
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

  useEffect(() => {
    // Only redirect if we're not already on the login or signup pages
    if (!loading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        console.log("AppShell: Redirecting to login");
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Don't block rendering on the login/signup pages
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  if (currentPath === '/login' || currentPath === '/signup') {
    console.log("AppShell: Allowing login/signup pages");
    return <>{children}</>;
  }

  if (loading) {
    console.log("AppShell: Loading authentication state");
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    console.log("AppShell: No user, redirecting to login");
    return null; // Let the redirect happen
  }

  console.log("AppShell: User authenticated, rendering children");
  return <>{children}</>;
}