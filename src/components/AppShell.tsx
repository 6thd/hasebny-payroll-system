"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "./LoadingSpinner";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login only after loading is complete and if there's no user.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // First, handle the initial loading state.
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // After loading, if there's no user, we are in the process of redirecting.
  // Return null to avoid rendering anything while the redirect happens.
  if (!user) {
    return null;
  }
  
  // If loading is finished and there is a user, render the children.
  return <>{children}</>;
}
