"use client";

import HeroSection from './HeroSection';
import FeaturesGrid from './FeaturesGrid';
import Clients from './Clients';
import Testimonials from './Testimonials';
import PublicFooter from './PublicFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm py-4 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 text-white font-bold text-xl w-10 h-10 rounded-lg flex items-center justify-center">
              ح
            </div>
            <span className="text-xl font-bold text-indigo-700">حسابني</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">ابدأ مجاناً</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <HeroSection />
        <FeaturesGrid />
        <Clients />
        <Testimonials />
      </main>

      <PublicFooter />
    </div>
  );
}