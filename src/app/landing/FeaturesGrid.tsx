"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, DollarSign, BarChart3 } from 'lucide-react';

const features = [
  { 
    title: "إدارة الموظفين", 
    icon: Users, 
    desc: "كل بيانات الموظف في مكان واحد",
    details: "سجل متكامل لكل موظف يشمل البيانات الشخصية، الوظيفية، والمالية في واجهة مبسطة وآمنة."
  },
  { 
    title: "الحضور والغياب", 
    icon: Clock, 
    desc: "تتبع ذكي لوقت العمل والإجازات",
    details: "نظام متقدم لتتبع الحضور والانصراف مع إمكانية رصد الإجازات والغيابات بشكل آلي."
  },
  { 
    title: "الرواتب التلقائية", 
    icon: DollarSign, 
    desc: "حسابات دقيقة وشفافة",
    details: "حساب الرواتب الشهري تلقائياً مع إمكانية تخصيص العناصر والخصومات حسب سياسة الشركة."
  },
  { 
    title: "التقارير والتحليلات", 
    icon: BarChart3, 
    desc: "مخططات وبيانات لحظية",
    details: "تقارير مفصلة ورسوم بيانية تفاعلية تساعد على اتخاذ قرارات استراتيجية مبنية على البيانات."
  },
];

export default function FeaturesGrid() {
  return (
    <section className="bg-white py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-indigo-700">أهم الميزات</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          نظام حسابني يجمع بين قوة الأداء وسهولة الاستخدام في واجهة عربية حديثة ومتوافقة مع معايير العمل السعودية
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col items-center bg-gray-50 rounded-xl shadow-md py-8 px-4 hover:shadow-lg transition-shadow">
              <div className="bg-indigo-100 p-3 rounded-full mb-4">
                <feature.icon className="w-8 h-8 text-indigo-700" />
              </div>
              <CardHeader className="p-0 mb-2">
                <CardTitle className="font-bold text-lg text-center text-indigo-700">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-center">
                <p className="text-gray-700 mb-2">{feature.desc}</p>
                <p className="text-sm text-gray-500">{feature.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}