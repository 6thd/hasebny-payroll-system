"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Worker } from '@/types';
import { calculatePayroll, getAttendanceStatusForDay, MONTHS } from '@/lib/utils';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const COLORS = {
  present: '#22c55e', // green-500
  on_leave: '#3b82f6', // blue-500
  absent: '#ef4444', // red-500
  weekend: '#64748b', // slate-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-md shadow-md">
        <p className="font-bold">{label}</p>
        <p className="text-sm text-primary">{`تكلفة الرواتب: ${payload[0].value.toLocaleString()} ريال`}</p>
      </div>
    );
  }
  return null;
};


export default function AnalyticsCharts() {
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const workers = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));

        // --- Line Chart Data (Last 6 Months) ---
        const payrollHistory = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const year = d.getFullYear();
          const month = d.getMonth();

          const attendanceSnapshot = await getDocs(collection(db, `attendance_${year}_${month + 1}`));
          const attendanceData: { [key: string]: any } = {};
          attendanceSnapshot.forEach(doc => {
            attendanceData[doc.id] = doc.data().days;
          });
          
          let monthlyTotal = 0;
          workers.forEach(worker => {
              const workerWithAttendance = { ...worker, days: attendanceData[worker.id] || {} };
              monthlyTotal += calculatePayroll(workerWithAttendance, year, month).netSalary;
          });
          
          payrollHistory.push({
            name: MONTHS[month],
            'تكلفة الرواتب': monthlyTotal,
          });
        }
        setLineChartData(payrollHistory);

        // --- Pie Chart Data (Current Month) ---
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const attendanceSnapshot = await getDocs(collection(db, `attendance_${currentYear}_${currentMonth + 1}`));
        const attendanceData: { [key: string]: any } = {};
        attendanceSnapshot.forEach(doc => {
          attendanceData[doc.id] = doc.data().days;
        });
        
        const statusCount = { present: 0, on_leave: 0, absent: 0, weekend: 0, no_data: 0 };
        workers.forEach(worker => {
          for(let day = 1; day <= daysInMonth; day++) {
            const dayData = attendanceData[worker.id]?.[day];
            const isFriday = new Date(currentYear, currentMonth, day).getDay() === 5;
            const status = getAttendanceStatusForDay(dayData, isFriday);
            if (status !== 'no_data') {
                statusCount[status]++;
            }
          }
        });

        const finalPieData = [
            { name: 'حضور', value: statusCount.present, color: COLORS.present },
            { name: 'إجازة', value: statusCount.on_leave, color: COLORS.on_leave },
            { name: 'غياب', value: statusCount.absent, color: COLORS.absent },
            { name: 'عطلة', value: statusCount.weekend, color: COLORS.weekend },
        ].filter(d => d.value > 0);
        setPieChartData(finalPieData);

      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 no-print">
      <Card className="lg:col-span-3 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp />تطور تكلفة الرواتب (آخر 6 أشهر)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="تكلفة الرواتب" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieIcon />توزيع الحضور (الشهر الحالي)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? <LoadingSpinner /> : (
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} يوم`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
