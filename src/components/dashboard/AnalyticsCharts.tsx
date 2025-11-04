"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Worker, MonthlyData } from '@/types';
import { calculatePayroll, getAttendanceStatusForDay, MONTHS, processWorkerData } from '@/lib/utils';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const COLORS = {
  present: 'hsl(var(--primary))',
  on_leave: 'hsl(var(--chart-2))',
  absent: 'hsl(var(--destructive))',
  weekend: 'hsl(var(--muted))',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-primary">{`تكلفة الرواتب: ${payload[0].value.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`}</p>
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

          const salaryCollectionName = `salaries_${year}_${month + 1}`;
          const monthlyDocsSnap = await getDocs(collection(db, salaryCollectionName));
          const monthlyDataMap: { [employeeId: string]: MonthlyData } = {};
          monthlyDocsSnap.forEach(doc => {
            monthlyDataMap[doc.id] = doc.data() as MonthlyData;
          });
          
          let monthlyTotal = 0;
          workers.forEach(worker => {
              const workerWithAttendance = { 
                ...worker, 
                days: attendanceData[worker.id] || {},
                commission: monthlyDataMap[worker.id]?.commission || 0,
                advances: monthlyDataMap[worker.id]?.advances || 0,
                penalties: monthlyDataMap[worker.id]?.penalties || 0,
              };
              const processedWorker = processWorkerData(workerWithAttendance, year, month);
              monthlyTotal += calculatePayroll(processedWorker, year, month).netSalary;
          });
          
          payrollHistory.push({
            name: MONTHS[month],
            'تكلفة الرواتب': Math.round(monthlyTotal),
          });
        }
        setLineChartData(payrollHistory);

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const currentAttendanceSnapshot = await getDocs(collection(db, `attendance_${currentYear}_${currentMonth + 1}`));
        const currentAttendanceData: { [key: string]: any } = {};
        currentAttendanceSnapshot.forEach(doc => {
          currentAttendanceData[doc.id] = doc.data().days;
        });
        
        let statusCount = { present: 0, on_leave: 0, absent: 0, weekend: 0, no_data: 0 };
        
        for(const worker of workers) {
            for(let day = 1; day <= daysInMonth; day++) {
                const dayData = currentAttendanceData[worker.id]?.[day];
                const isFriday = new Date(currentYear, currentMonth, day).getDay() === 5;
                const status = getAttendanceStatusForDay(dayData, isFriday);
                statusCount[status]++;
            }
        }
        
        const totalWorkingDays = (statusCount.present + statusCount.on_leave + statusCount.absent);
        const finalPieData = [
            { name: 'حضور', value: statusCount.present, color: COLORS.present },
            { name: 'إجازة', value: statusCount.on_leave, color: COLORS.on_leave },
            { name: 'غياب', value: statusCount.absent, color: COLORS.absent },
        ].filter(d => d.value > 0);

        setPieChartData(finalPieData);

      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const handleDataUpdate = () => fetchData();
    fetchData();
    window.addEventListener('data-updated', handleDataUpdate);
    return () => window.removeEventListener('data-updated', handleDataUpdate);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 no-print">
      <Card className="lg:col-span-3 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp />تطور تكلفة الرواتب</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {loading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)} ألف`} stroke="hsl(var(--muted-foreground))"/>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="تكلفة الرواتب" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} dot={{r: 4}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><PieIcon />توزيع الحضور (الشهر الحالي)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {loading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
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
