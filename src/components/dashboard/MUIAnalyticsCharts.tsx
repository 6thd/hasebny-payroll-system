"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Worker, MonthlyData } from '@/types';
import { calculatePayroll, getAttendanceStatusForDay, MONTHS, processWorkerData } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { 
  LineChart, 
  LinePlot, 
  ChartsXAxis, 
  ChartsYAxis, 
  ChartsTooltip, 
  ChartsLegend,
  PieChart,
  PiePlot,
  ChartContainer
} from '@mui/x-charts';
import { useTheme } from '@mui/material/styles';

const COLORS = {
  present: '#8B5CF6', // primary color from your theme
  on_leave: '#10B981', // green-500
  absent: '#EF4444',   // red-500
  weekend: '#9CA3AF',  // gray-400
};

export default function MUIAnalyticsCharts() {
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const workers = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));

        // Fetch payroll history for the last 6 months
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
            salaryCost: Math.round(monthlyTotal),
          });
        }
        setLineChartData(payrollHistory);

        // Fetch attendance distribution for current month
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
            { id: 0, label: 'حضور', value: statusCount.present, color: COLORS.present },
            { id: 1, label: 'إجازة', value: statusCount.on_leave, color: COLORS.on_leave },
            { id: 2, label: 'غياب', value: statusCount.absent, color: COLORS.absent },
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
      {/* Salary Cost Trend Chart */}
      <Card className="lg:col-span-3 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp />تطور تكلفة الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <ChartContainer
              series={[
                {
                  data: lineChartData.map(item => item.salaryCost),
                  label: 'تكلفة الرواتب',
                  type: 'line',
                  color: COLORS.present,
                },
              ]}
              xAxis={[
                {
                  id: 'months',
                  data: lineChartData.map(item => item.name),
                  scaleType: 'band',
                },
              ]}
              yAxis={[
                {
                  id: 'salary',
                  valueFormatter: (value: number) => `${(value / 1000).toFixed(0)} ألف`,
                },
              ]}
            >
              <ChartsXAxis axisId="months" />
              <ChartsYAxis axisId="salary" />
              <LinePlot />
              <ChartsTooltip 
                trigger="item"
                itemContent={(item: any) => (
                  <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
                    <p className="font-bold text-foreground">{lineChartData[item.dataIndex]?.name}</p>
                    <p className="text-sm text-primary">
                      {`تكلفة الرواتب: ${item.value.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`}
                    </p>
                  </div>
                )}
              />
              <ChartsLegend />
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Attendance Distribution Chart */}
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieIcon />توزيع الحضور (الشهر الحالي)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <ChartContainer
              series={[
                {
                  data: pieChartData,
                  innerRadius: 60,
                  outerRadius: 100,
                  paddingAngle: 5,
                  cornerRadius: 5,
                  startAngle: 0,
                  endAngle: 360,
                  cx: '50%',
                  cy: '50%',
                  highlightScope: { fade: 'global', highlight: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30 },
                  type: 'pie',
                } as any, // Type assertion to bypass TypeScript error
              ]}
              width={300}
              height={300}
            >
              <PiePlot
                data={pieChartData}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                cornerRadius={5}
                cx="50%"
                cy="50%"
              />
              <ChartsTooltip 
                trigger="item"
                itemContent={(item: any) => (
                  <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
                    <p className="font-bold text-foreground">{item.label}</p>
                    <p className="text-sm text-primary">
                      {`${item.value} يوم (${((item.value / pieChartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%)`}
                    </p>
                  </div>
                )}
              />
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}