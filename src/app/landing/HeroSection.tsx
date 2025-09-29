"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const router = useRouter();

  const handleTryNow = () => {
    router.push('/signup');
  };

  return (
    <section className="bg-gradient-to-r from-indigo-700 via-purple-500 to-indigo-800 py-20 px-8 text-white text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 drop-shadow-lg">
        حسابني – عصر جديد لإدارة الرواتب والموارد البشرية
      </h1>
      <p className="mb-8 text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto">
        نظام متكامل يعتمد الذكاء والتحليلات، سهولة استخدام وأداء مبهر بإمكانات WebAssembly وواجهة عربية حديثة.
      </p>
      <Button 
        onClick={handleTryNow}
        className="bg-white text-indigo-700 px-8 py-4 rounded-full font-bold shadow-xl hover:bg-indigo-100 transition text-lg"
        size="lg"
      >
        جرب حسابني الآن
      </Button>
      <div className="mt-12 flex justify-center gap-8">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 w-40 h-40 flex items-center justify-center">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 w-40 h-40 flex items-center justify-center">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
        </div>
      </div>
    </section>
  );
}