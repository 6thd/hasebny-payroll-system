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

  // After loading, if there's a user, render the children.
  // The useEffect above will handle redirection for non-users.
  if (user) {
    return <>{children}</>;
  }
  
  // While redirecting or if there's no user, return null to avoid any flicker.
  // The spinner is only shown during the initial auth check.
  return null;
}
