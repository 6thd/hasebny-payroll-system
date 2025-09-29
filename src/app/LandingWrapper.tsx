"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import LandingPage from './landing/page';
import AppShell from '@/components/AppShell';
import Dashboard from '@/components/dashboard/Dashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LandingWrapper() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // While checking auth status, show loading spinner
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return (
      <AppShell>
        <Dashboard />
      </AppShell>
    );
  }

  // If no user is authenticated, show landing page
  return <LandingPage />;
}