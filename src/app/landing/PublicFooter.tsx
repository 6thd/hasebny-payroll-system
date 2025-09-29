"use client";

export default function PublicFooter() {
  return (
    <footer className="bg-indigo-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">حسابني</h3>
            <p className="text-indigo-200">
              نظام متكامل لإدارة الرواتب والموارد البشرية يعتمد على الذكاء والتحليلات لتقديم تجربة فريدة.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">المنتجات</h4>
            <ul className="space-y-2 text-indigo-200">
              <li><a href="#" className="hover:text-white transition">إدارة الموظفين</a></li>
              <li><a href="#" className="hover:text-white transition">الحضور والغياب</a></li>
              <li><a href="#" className="hover:text-white transition">حساب الرواتب</a></li>
              <li><a href="#" className="hover:text-white transition">التقارير والتحليلات</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">الشركة</h4>
            <ul className="space-y-2 text-indigo-200">
              <li><a href="#" className="hover:text-white transition">عن حسابني</a></li>
              <li><a href="#" className="hover:text-white transition">التسعير</a></li>
              <li><a href="#" className="hover:text-white transition">المدونة</a></li>
              <li><a href="#" className="hover:text-white transition">الوظائف</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">الدعم</h4>
            <ul className="space-y-2 text-indigo-200">
              <li><a href="#" className="hover:text-white transition">مركز المساعدة</a></li>
              <li><a href="#" className="hover:text-white transition">التوثيق</a></li>
              <li><a href="#" className="hover:text-white transition">الاتصال بنا</a></li>
              <li><a href="#" className="hover:text-white transition">سياسة الخصوصية</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-indigo-800 mt-8 pt-8 text-center text-indigo-300">
          <p>جميع الحقوق محفوظة &copy; حسابني 2025</p>
        </div>
      </div>
    </footer>
  );
}