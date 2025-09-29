"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: "أحمد محمد",
    role: "مدير الموارد البشرية",
    company: "شركة التقنية المتقدمة",
    content: "حول حسابني عملية إدارة الرواتب من مهمة معقدة إلى تجربة سلسة. توفير الوقت والدقة في الحسابات جعلته أداة لا غنى عنها لدينا.",
    avatar: "أم"
  },
  {
    name: "فاطمة علي",
    role: "مديرة المالية",
    company: "مجموعة البناء الراسخ",
    content: "التكامل مع أنظمة الحضور والانصراف وأنظمة الرواتب أنقذنا من الأخطاء البشرية وأصبح لدينا رؤية شاملة عن تكاليف الموارد البشرية.",
    avatar: "ف"
  },
  {
    name: "سارة عبدالله",
    role: " владة الموارد البشرية",
    company: "مؤسسة الخدمات الطبية",
    content: "واجهة عربية حديثة ودعم فني ممتاز. استطعنا تخصيص النظام ليناسب سياساتنا الداخلية بدقة تامة.",
    avatar: "س"
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-indigo-700">قصص نجاح من عملائنا</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          اكتشف كيف ساعد حسابني الشركات في تحسين كفاءة إدارة الموارد البشرية
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-indigo-100 text-indigo-700">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.company}</p>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}