
'use client';

import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { type PayrollData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartsProps {
  payrollHistory: PayrollData[];
}

export default function Charts({ payrollHistory }: ChartsProps) {
  const barChartData = {
    labels: payrollHistory.map(p => `${p.month} ${p.year}`),
    datasets: [
      {
        label: ' صافي الراتب',
        data: payrollHistory.map(p => p.netSalary),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'إجمالي الاستقطاعات',
        data: payrollHistory.map(p => p.deductions || 0), // Added safety
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
       {
        label: 'إجمالي البدلات',
        data: payrollHistory.map(p => p.totalAllowances || 0), // Added safety
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'أجر العمل الإضافي',
        data: payrollHistory.map(p => p.overtimePay || 0), // Added safety
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      },
    ],
  };

  const lastPayroll = payrollHistory.length > 0 ? payrollHistory[0] : null;
  const pieChartData = {
    labels: ['الراتب الأساسي', 'إجمالي البدلات', 'أجر العمل الإضافي'],
    datasets: [
      {
        data: lastPayroll ? [lastPayroll.basicSalary, lastPayroll.totalAllowances || 0, lastPayroll.overtimePay || 0] : [], // Added safety
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>تحليل الرواتب خلال الأشهر الماضية</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>تفصيل راتب آخر شهر</CardTitle>
          </CardHeader>
          <CardContent>
             {lastPayroll ? (
                <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
             ) : (
                <p className="text-center text-muted-foreground">لا توجد بيانات لعرضها</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
