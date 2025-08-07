"use client";

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Worker } from '@/types';
import { calculatePayroll } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChartIcon } from 'lucide-react';

interface ChartsProps {
  workers: Worker[];
  year: number;
  month: number;
}

const COLORS = ['#3b82f6', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Charts({ workers, year, month }: ChartsProps) {
  const deptData = workers.reduce((acc, worker) => {
    const dept = worker.department || 'غير محدد';
    const { netSalary } = calculatePayroll(worker, year, month);
    if (!acc[dept]) acc[dept] = 0;
    acc[dept] += netSalary;
    return acc;
  }, {} as { [key: string]: number });

  const barChartData = Object.keys(deptData).map(key => ({ name: key, 'تكلفة الرواتب': deptData[key] }));
  
  const payrolls = workers.map(w => calculatePayroll(w, year, month));
  const totalBasic = workers.reduce((sum, w) => sum + (w.basicSalary || 0), 0);
  const totalAllowances = payrolls.reduce((sum, p) => sum + p.totalAllowances, 0);
  const totalOvertimePay = payrolls.reduce((sum, p) => sum + p.overtimePay, 0);

  const pieChartData = [
    { name: 'الرواتب الأساسية', value: totalBasic },
    { name: 'البدلات', value: totalAllowances },
    { name: 'العمل الإضافي', value: totalOvertimePay },
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 no-print">
      <Card className="lg:col-span-3 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 />تحليل الرواتب حسب الأقسام</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} layout="vertical" margin={{ right: 30 }}>
              <XAxis type="number" tickFormatter={(value) => `${value.toLocaleString()}`} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} ريال`} />
              <Bar dataKey="تكلفة الرواتب" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieChartIcon />مكونات إجمالي الرواتب</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                            {`${(percent * 100).toFixed(0)}%`}
                        </text>
                    );
                }}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} ريال`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
