
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import LoadingSpinner from '@/components/LoadingSpinner';
import { calculateLeaveSettlement, finalizeLeaveSettlement } from '@/app/actions/leave';
import type { Worker, LeaveSettlementCalculation, LeavePolicy } from '@/types';
import { toast } from "sonner";

interface LeaveSettlementModalProps {
  worker: Worker & { lastApprovedLeaveDate?: string };
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

const ResultRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="flex justify-between items-center py-2 border-b border-border/50">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-semibold text-md text-foreground">{value ?? 'N/A'}</span>
    </div>
);


export default function LeaveSettlementModal({ worker, isOpen, onClose, onAction }: LeaveSettlementModalProps) {
  const [step, setStep] = useState<'initial' | 'calculating' | 'results' | 'finalizing'>('initial');
  const [results, setResults] = useState<LeaveSettlementCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setStep('calculating');
    try {
      const result = await calculateLeaveSettlement(worker.id, worker.lastApprovedLeaveDate);
      if (result.error) {
        throw new Error(result.error);
      }
      setResults(result as LeaveSettlementCalculation);
      setStep('results');
    } catch (e: any) {
      console.error("Calculation failed:", e);
      setError(e.message || "Failed to calculate settlement.");
      setStep('initial');
    }
  };

  const handleFinalize = async () => {
    if (!results) return;
    setStep('finalizing');
    try {
        const finalizationResult = await finalizeLeaveSettlement(results);
        if (finalizationResult.error) {
            throw new Error(finalizationResult.error);
        }
        toast.success(`تمت تصفية مستحقات الموظف ${worker.name} بنجاح.`);
        onAction(); 
        handleClose();
    } catch (e: any) {
        console.error("Finalization failed:", e);
        setError(e.message || "فشلت عملية التصفية النهائية.");
        toast.error(e.message || "فشلت عملية التصفية النهائية.");
        setStep('results'); // Go back to results step on failure
    }
  };
  
  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow the dialog to close
    setTimeout(() => {
        setStep('initial');
        setResults(null);
        setError(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>تصفية رصيد الإجازات السنوية للموظف: {worker.name}</DialogTitle>
           <DialogDescription>
            هذه النافذة تسمح لك بحساب وتصفية رصيد الإجازات السنوية للموظف. سيتم إنشاء سجل في تاريخ خدمة الموظف بالنتيجة.
          </DialogDescription>
        </DialogHeader>

        {error && (
            <Alert variant="destructive">
                <AlertTitle>حدث خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {step === 'initial' && (
            <div className="py-6 text-center">
                <p className="mb-4">اضغط على الزر أدناه لحساب المستحقات بناءً على آخر إجازة معتمدة للموظف بتاريخ {worker.lastApprovedLeaveDate || 'غير محدد'}.</p>
                <Button onClick={handleCalculate} size="lg">
                    بدء الحساب
                </Button>
            </div>
        )}

        {(step === 'calculating' || step === 'finalizing') && (
            <div className="py-10">
                <LoadingSpinner />
                <p className="text-center mt-4">{step === 'calculating' ? 'جاري حساب المستحقات...' : 'جاري تنفيذ التصفية النهائية...'}</p>
            </div>
        )}

        {step === 'results' && results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            
            {/* Left Column: Calculation Breakdown */}
            <div className="flex flex-col space-y-4 p-4 bg-muted/50 rounded-lg">
                 <div className="text-center bg-primary/10 text-primary p-4 rounded-lg">
                    <p className="font-semibold">رصيد الأيام المستحقة</p>
                    <p className="text-4xl font-bold tracking-tighter">
                        {results.accruedDays.toFixed(2)} يوم
                    </p>
                </div>
                 <div className="text-center bg-primary/10 text-primary p-4 rounded-lg">
                    <p className="font-semibold">المبلغ المالي المستحق</p>
                     <p className="text-3xl font-bold tracking-tighter">
                        {results.monetaryValue.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}
                    </p>
                </div>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-2">
                <h4 className="font-semibold text-md text-foreground">تفاصيل الحساب</h4>
                <ResultRow label="سنوات الخدمة" value={results.calculationBasis.serviceYears.toFixed(2)} />
                <ResultRow label="الاستحقاق السنوي الحالي" value={`${results.calculationBasis.annualEntitlement} يوم`} />
                <ResultRow label="تاريخ بداية الفترة" value={results.calculationBasis.periodStartDate} />
                <ResultRow label="تاريخ نهاية الفترة" value={results.calculationBasis.periodEndDate} />
                <ResultRow label="الأيام المحسوبة في الفترة" value={`${results.calculationBasis.daysCounted} يوم`} />
                
                <Alert className="mt-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="mr-4">السياسة المطبقة (افتراضية)</AlertTitle>
                    <AlertDescription>
                        <pre className="mt-2 w-full text-xs rounded-md bg-background p-4 text-foreground/80 overflow-x-auto">
                            {JSON.stringify(results.calculationBasis.policy, null, 2)}
                        </pre>
                    </AlertDescription>
                </Alert>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button variant="outline">إغلاق</Button>
            </DialogClose>
            {step === 'results' && (
                 <Button onClick={handleFinalize}>
                    تأكيد وتنفيذ التصفية النهائية
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
