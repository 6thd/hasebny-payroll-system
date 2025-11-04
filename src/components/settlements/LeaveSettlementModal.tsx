
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { calculateLeaveSettlement, finalizeLeaveSettlement } from '@/app/actions/leave-settlement-actions';
import type { LeaveSettlementCalculation } from '@/types';
import { Label } from '../ui/label';

interface LeaveSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
}

export default function LeaveSettlementModal({ isOpen, onClose, workerId, workerName }: LeaveSettlementModalProps) {
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculationResult, setCalculationResult] = useState<LeaveSettlementCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setCalculationResult(null);
    try {
      const { settlement, error } = await calculateLeaveSettlement(workerId, settlementDate);
      if (error) {
        toast.error(`خطأ في الحساب: ${error}`);
      } else if (settlement) {
        setCalculationResult(settlement);
        toast.success('تم الحساب بنجاح.');
      }
    } catch (error: any) {
      toast.error(`فشل الحساب: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinalize = async () => {
    if (!calculationResult) return;
    setIsFinalizing(true);
    try {
        const result = await finalizeLeaveSettlement(calculationResult);
        if (result.success) {
            toast.success('تمت تسوية الإجازة بنجاح!');
            onClose(); // Close modal on success
        } else {
            toast.error(`فشل في تسوية الإجازة: ${result.error}`);
        }
    } catch (error: any) {
        toast.error(`حدث خطأ غير متوقع: ${error.message}`);
    } finally {
        setIsFinalizing(false);
    }
  };
  
  // Helper to format date from various types
  const formatDate = (date: any) => {
      if (!date) return 'N/A';
      // Handle Firestore Timestamp, ISO string, or Date object
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('ar-SA');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسوية رصيد الإجازات لـ {workerName}</DialogTitle>
          <DialogDescription>حساب وتصفية رصيد الإجازة السنوي للموظف.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="settlement-date" className="whitespace-nowrap">تاريخ التسوية</Label>
            <Input
              id="settlement-date"
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={handleCalculate} disabled={isCalculating || !settlementDate} className="w-full">
            {isCalculating ? 'جارٍ الحساب...' : 'حساب الرصيد المستحق'}
          </Button>
        </div>

        {calculationResult && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2 text-sm">
            <h3 className="font-semibold text-lg text-center mb-3">نتائج الحساب</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p className="font-semibold">إجمالي الأيام المستحقة:</p>
              <p>{calculationResult.accruedDays?.toFixed(2) || 'N/A'}</p>
              
              <p className="font-semibold">القيمة النقدية:</p>
              <p>{calculationResult.monetaryValue?.toFixed(2) || 'N/A'} ريال</p>

              <p className="font-semibold">سنوات الخدمة:</p>
              <p>{calculationResult.calculationBasis?.serviceYears?.toFixed(2) || 'N/A'}</p>
              
              <p className="font-semibold">الاستحقاق السنوي:</p>
              <p>{calculationResult.calculationBasis?.annualEntitlement || 'N/A'} يوم</p>

              <p className="font-semibold">فترة الحساب:</p>
              <p>{formatDate(calculationResult.calculationBasis?.periodStartDate)} - {formatDate(calculationResult.calculationBasis?.periodEndDate)}</p>
              
              <p className="font-semibold">الأيام المحتسبة:</p>
              <p>{calculationResult.calculationBasis?.daysCounted || 'N/A'} يوم</p>
            </div>
          </div>
        )}

        <DialogFooter className='mt-4'>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleFinalize} disabled={!calculationResult || isFinalizing}>
            {isFinalizing ? 'جارٍ الحفظ...' : 'اعتماد وتسوية'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
