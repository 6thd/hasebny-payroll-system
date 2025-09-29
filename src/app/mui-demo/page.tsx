'use client';

import MUIExample from '@/components/examples/MUIExample';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function MUIDemoPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">عرض تجريبي لمكونات MUI</h1>
        <Button 
          variant="contained" 
          onClick={() => router.push('/')}
        >
          العودة للرئيسية
        </Button>
      </div>
      
      <MUIExample />
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">كيفية استخدام MUI في المشروع:</h2>
        <ul className="list-disc pr-5 space-y-2">
          <li>جميع مكونات MUI متاحة للاستخدام في أي مكون</li>
          <li>يتم تطبيق التصميم الموحد تلقائياً</li>
          <li>يدعم التخطيط من اليمين لليسار (RTL)</li>
          <li>متوافق مع نظام الألوان الحالي</li>
        </ul>
      </div>
    </div>
  );
}