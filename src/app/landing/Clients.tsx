"use client";

export default function Clients() {
  // In a real implementation, you would replace these with actual client logos
  const clients = [
    { name: "شركة التقنية المتقدمة", logo: "/client-tech.svg" },
    { name: "مجموعة البناء الراسخ", logo: "/client-construction.svg" },
    { name: "مصنع المنتجات الغذائية", logo: "/client-food.svg" },
    { name: "مؤسسة الخدمات الطبية", logo: "/client-medical.svg" },
  ];

  return (
    <section className="bg-indigo-50 py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">يثق بنا مئات الشركات</h2>
        <p className="text-center text-gray-600 mb-12">شركات من مختلف القطاعات تعتمد على حسابني لإدارة مواردها البشرية</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {clients.map((client, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="bg-white rounded-xl shadow-md p-6 w-full h-32 flex items-center justify-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">{client.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}