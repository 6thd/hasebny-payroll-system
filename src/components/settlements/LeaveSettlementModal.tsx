"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Worker } from '@/types';
import { calculateLeaveBalance, LeaveBalanceOutput } from '@/app/actions/leave-balance';
import { settleLeaveBalance } from '@/app/actions/leave';
import LoadingSpinner from '../LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ShieldCheck, Loader2 } from 'lucide-react';

interface LeaveSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}

const ResultRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center py-2">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);


export default function LeaveSettlementModal({ isOpen, onClose, worker }: LeaveSettlementModalProps) {
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LeaveBalanceOutput | null>(null);
  const { toast } = useToast();

  const handleCalculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    const result = await calculateLeaveBalance({ employeeId: worker.id });

    if (result.success) {
      setResults(result.data);
    } else {
      setError(result.error);
      toast({
        title: "خطأ في الحساب",
        description: result.error,
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [worker.id, toast]);

  useEffect(() => {
    if (isOpen) {
      handleCalculate();
    }
  }, [isOpen, handleCalculate]);
  
  const handleSettle = async () => {
    if (!results) return;
    setFinalizing(true);
    const result = await settleLeaveBalance({
        employeeId: worker.id,
        settlementDate: new Date(),
        results: results,
    });
    setFinalizing(false);

    if (result.success) {
        toast({
            title: "تمت التصفية بنجاح",
            description: `تمت تصفية رصيد إجازات الموظف ${worker.name}.`
        });
        onClose();
    } else {
        toast({
            title: "خطأ في التصفية",
            description: result.error,
            variant: "destructive",
        });
    }
  }

  const resetAndClose = () => {
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تصفية رصيد الإجازة لـِ {worker.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4 min-h-[300px]">
            {loading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
            
            {error && <p className="text-destructive text-center">{error}</p>}

            {results && (
                <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                        <p className="text-sm text-primary font-semibold">رصيد الأيام المتراكمة</p>
                        <p className="text-3xl font-bold text-primary">{results.accruedDays} يوم</p>
                        <p className="text-md text-primary/80">~ {results.monetaryValue.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</p>
                    </div>

                    <Separator />

                    <h4 className="font-semibold text-md">تفاصيل الحساب</h4>
                    <ResultRow label="سنوات الخدمة" value={results.calculationBasis.serviceYears} />
                    <ResultRow label="الاستحقاق السنوي الحالي" value={`${results.calculationBasis.annualEntitlement} يوم`} />
                    <ResultRow label="تاريخ بداية الفترة" value={results.calculationBasis.periodStartDate} />
                    <ResultRow label="تاريخ نهاية الفترة" value={results.calculationBasis.periodEndDate} />
                    <ResultRow label="الأيام المحسوبة في الفترة" value={`${results.calculationBasis.daysCounted} يوم`} />
                    
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>السياسة المطبقة (افتراضية)</AlertTitle>
                        <AlertDescription className="text-xs">
                           <pre className="mt-2 rounded-md bg-slate-950 p-4">
                                <code className="text-white">{JSON.stringify(results.calculationBasis.policy, null, 2)}</code>
                            </pre>
                        </AlertDescription>
                    </Alert>

                </div>
            )}
        </div>

        <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="secondary" onClick={handleCalculate} disabled={loading || finalizing}>
                {loading ? '...جاري الحساب' : 'إعادة الحساب'}
            </Button>
            {results && (
                 <Button variant="default" onClick={handleSettle} disabled={finalizing || loading}>
                    {finalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {finalizing ? "جارٍ الحفظ..." : "تأكيد وتصفية الرصيد"}
                </Button>
            )}
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={finalizing}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
