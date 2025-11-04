"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { predictSalaryTrends, PredictSalaryTrendsOutput } from '@/ai/flows/predict-salary-trends';
import { Worker, MonthlyData } from '@/types';
import { BrainCircuit, Loader2 } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { calculatePayroll, MONTHS } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '../ui/card';

interface PredictiveAnalysisProps {
  worker: Worker;
  currentYear: number;
  currentMonth: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-primary">{`صافي الراتب: ${payload[0].value.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`}</p>
      </div>
    );
  }
  return null;
};

const AnalysisItem = ({ title, value }: { title: string, value: string }) => (
    <div>
        <h4 className="font-semibold text-muted-foreground">{title}</h4>
        <p className="text-foreground">{value}</p>
    </div>
);

export default function PredictiveAnalysis({ worker, currentYear, currentMonth }: PredictiveAnalysisProps) {
  const [analysis, setAnalysis] = useState<PredictSalaryTrendsOutput['trendAnalysis'] | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchAndAnalyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    setChartData([]);

    try {
      const historicalData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const salaryCollectionName = `salaries_${year}_${month + 1}`;
        const docSnap = await getDocs(collection(db, salaryCollectionName));
        const monthlyDataMap: { [employeeId: string]: MonthlyData } = {};
        docSnap.forEach(doc => {
            if (doc.id === worker.id) {
                monthlyDataMap[doc.id] = doc.data() as MonthlyData;
            }
        });

        const workerWithMonthlyData = {
          ...worker,
          commission: monthlyDataMap[worker.id]?.commission || 0,
          advances: monthlyDataMap[worker.id]?.advances || 0,
          penalties: monthlyDataMap[worker.id]?.penalties || 0,
        };
        
        const payroll = calculatePayroll(workerWithMonthlyData, year, month);

        historicalData.push({
          month: MONTHS[month],
          year: year,
          netSalary: payroll.netSalary,
          overtimePay: payroll.overtimePay,
          advances: workerWithMonthlyData.advances,
          penalties: workerWithMonthlyData.penalties,
        });
      }

      setChartData(historicalData.map(d => ({ name: d.month, netSalary: d.netSalary })));
      
      const result = await predictSalaryTrends({
        employeeName: worker.name,
        timeSeriesData: JSON.stringify(historicalData),
      });

      if (result && result.trendAnalysis) {
        setAnalysis(result.trendAnalysis);
      } else {
        setError('لم يتمكن الذكاء الاصطناعي من تحليل البيانات.');
      }

    } catch (err) {
      setError('حدث خطأ أثناء جلب وتحليل البيانات. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={handleFetchAndAnalyze}>
          <BrainCircuit className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>تحليل الاتجاهات المالية لـ {worker.name} (آخر 6 أشهر)</AlertDialogTitle>
          <AlertDialogDescription>
            تحليل باستخدام الذكاء الاصطناعي للاتجاهات المالية بناءً على البيانات التاريخية.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-h-[300px] p-2 border rounded-md bg-muted/50 max-h-[60vh] overflow-y-auto">
          {loading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
          {error && <p className="text-destructive text-center">{error}</p>}
          
          {analysis && (
            <div className="space-y-4 p-2">
                <Card>
                    <CardContent className="h-[200px] pt-6">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)} ألف`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="netSalary" stroke="hsl(var(--primary))" strokeWidth={2} name="صافي الراتب" dot={{r: 4}}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <AnalysisItem title="📊 الاتجاه العام للراتب" value={analysis.overallTrend} />
                    <AnalysisItem title="💰 متوسط صافي الراتب" value={analysis.averageNetSalary} />
                    <AnalysisItem title="⏱️ تحليل العمل الإضافي" value={analysis.overtimeAnalysis} />
                    <AnalysisItem title="💸 تحليل الخصومات والسلف" value={analysis.deductionsAnalysis} />
                </div>
                 <div className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary">
                     <h4 className="font-semibold text-primary">💡 توصية ذكية</h4>
                     <p className="text-primary/90 text-sm">{analysis.recommendation}</p>
                 </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>إغلاق</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
