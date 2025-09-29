import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AppShell from "@/components/AppShell";
import Dashboard from "@/components/dashboard/Dashboard";
import LandingWrapper from './LandingWrapper';

export default function Home() {
  return <LandingWrapper />;
}
