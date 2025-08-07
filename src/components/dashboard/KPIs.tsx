"use client";

import type { Worker } from '@/types';
import { calculatePayroll } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPIsProps {
  workers: Worker[];
  year: number;
  month: number;
}

const KPICard = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="shadow-md transition-all hover:shadow-lg hover:scale-105">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </CardContent>
  </Card>
);

export default function KPIs({ workers, year, month }: KPIsProps) {
  if (!workers.length) {
    return (
      <div className="text-center col-span-4 text-gray-500 py-8 no-print">
        لا توجد بيانات موظفين لعرضها.
      </div>
    );
  }

  const payrolls = workers.map(w => calculatePayroll(w, year, month));
  const totalEmployees = workers.length;
  const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const totalOvertime = workers.reduce((sum, w) => sum + (w.totalOvertime || 0), 0);
  const CURRENCY = 'ريال';

  const kpis = [
    { label: 'إجمالي تكلفة الرواتب', value: `${totalPayroll.toFixed(2)} ${CURRENCY}` },
    { label: 'عدد الموظفين', value: totalEmployees },
    { label: 'متوسط الراتب', value: `${avgSalary.toFixed(2)} ${CURRENCY}` },
    { label: 'إجمالي الساعات الإضافية', value: `${totalOvertime.toFixed(1)} ساعة` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 no-print">
      {kpis.map(kpi => (
        <KPICard key={kpi.label} title={kpi.label} value={kpi.value} />
      ))}
    </div>
  );
}
