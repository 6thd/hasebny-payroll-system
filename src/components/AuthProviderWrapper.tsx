'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const DynamicAuthProvider = dynamic(() => import('@/context/AuthContext').then(mod => mod.AuthProvider), {
  ssr: false,
});

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <DynamicAuthProvider>{children}</DynamicAuthProvider>;
}
