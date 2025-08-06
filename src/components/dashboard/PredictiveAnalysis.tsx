"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { predictSalaryTrends } from '@/ai/flows/predict-salary-trends';
import { Worker, PayrollData } from '@/types';
import { BrainCircuit } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

interface PredictiveAnalysisProps {
  worker: Worker;
  payroll: PayrollData;
}

export default function PredictiveAnalysis({ worker, payroll }: PredictiveAnalysisProps) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    const financialData = {
      basicSalary: worker.basicSalary,
      housing: worker.housing,
      workNature: worker.workNature,
      transport: worker.transport,
      phone: worker.phone,
      food: worker.food,
      commission: worker.commission,
      overtimePay: payroll.overtimePay,
      advances: worker.advances,
      penalties: worker.penalties,
      absenceDeduction: payroll.absenceDeduction,
      netSalary: payroll.netSalary,
    };

    const timeSeriesData = JSON.stringify(financialData, null, 2);

    try {
      const result = await predictSalaryTrends({
        employeeId: worker.id,
        timeSeriesData: timeSeriesData,
      });
      setAnalysis(result.trendAnalysis);
    } catch (err) {
      setError('حدث خطأ أثناء تحليل البيانات. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={handleAnalysis}>
          <BrainCircuit className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تحليل الاتجاهات المالية لـ {worker.name}</AlertDialogTitle>
          <AlertDialogDescription>
            تحليل باستخدام الذكاء الاصطناعي للاتجاهات المالية بناءً على البيانات الحالية.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-h-[100px] p-4 border rounded-md bg-muted/50">
          {loading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
          {error && <p className="text-destructive">{error}</p>}
          {analysis && <p>{analysis}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>إغلاق</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
