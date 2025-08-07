"use client";
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Worker, PayrollData } from '@/types';
import { calculatePayroll, MONTHS } from '@/lib/utils';
import PredictiveAnalysis from '../PredictiveAnalysis';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  year: number;
  month: number;
  onDataUpdate: () => void;
}

export default function PayrollModal({ isOpen, onClose, workers: initialWorkers, year, month, onDataUpdate }: PayrollModalProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [payrolls, setPayrolls] = useState<{ [key: string]: PayrollData }>({});
  const { toast } = useToast();

  const recomputePayrolls = (currentWorkers: Worker[]) => {
    const newPayrolls: { [key: string]: PayrollData } = {};
    currentWorkers.forEach(w => {
      newPayrolls[w.id] = calculatePayroll(w, year, month);
    });
    setPayrolls(newPayrolls);
  };

  useEffect(() => {
    setWorkers(initialWorkers);
    recomputePayrolls(initialWorkers);
  }, [initialWorkers, year, month]);

  const handleInputChange = (workerId: string, field: keyof Worker, value: string) => {
    const updatedWorkers = workers.map(w =>
      w.id === workerId ? { ...w, [field]: Number(value) || 0 } : w
    );
    setWorkers(updatedWorkers);
    recomputePayrolls(updatedWorkers);
  };

  const handleSave = async (worker: Worker) => {
    const { id, days, totalRegular, totalOvertime, absentDays, ...workerData } = worker;
    try {
      await setDoc(doc(db, 'employees', worker.id), workerData, { merge: true });
      toast({ title: `تم حفظ بيانات ${worker.name}` });
      onDataUpdate();
    } catch (error) {
      toast({ title: 'خطأ', description: 'لم يتم حفظ البيانات', variant: 'destructive' });
    }
  };
  
  const financialFields: { key: keyof Worker, label: string }[] = [
    { key: 'basicSalary', label: 'الأساسي' }, { key: 'housing', label: 'سكن' }, { key: 'workNature', label: 'طبيعة عمل' },
    { key: 'transport', label: 'مواصلات' }, { key: 'phone', label: 'هاتف' }, { key: 'food', label: 'طعام' },
    { key: 'commission', label: 'عمولة' },
  ];
  const deductionFields: { key: keyof Worker, label: string }[] = [
    { key: 'advances', label: 'سلف' }, { key: 'penalties', label: 'جزاءات' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col printable">
        <DialogHeader>
          <DialogTitle>مسير رواتب شهر {MONTHS[month]} {year}</DialogTitle>
          <DialogDescription>
            يمكنك تعديل القيم المالية للموظفين هنا. سيتم إعادة حساب القيم المشتقة تلقائياً.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead rowSpan={2} className="w-[150px] sticky rtl:right-0 ltr:left-0 bg-background z-20">الموظف</TableHead>
                <TableHead colSpan={financialFields.length + 1} className="text-center text-green-600">الاستحقاقات</TableHead>
                <TableHead colSpan={deductionFields.length + 1} className="text-center text-red-600">الاستقطاعات</TableHead>
                <TableHead rowSpan={2} className="text-primary">صافي الراتب</TableHead>
                <TableHead rowSpan={2}>إجراءات</TableHead>
              </TableRow>
              <TableRow>
                {financialFields.map(f => <TableHead key={f.key}>{f.label}</TableHead>)}
                <TableHead>إضافي</TableHead>
                {deductionFields.map(f => <TableHead key={f.key}>{f.label}</TableHead>)}
                <TableHead>غياب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map(worker => (
                <TableRow key={worker.id}>
                  <TableCell className="font-semibold sticky rtl:right-0 ltr:left-0 bg-background z-10">{worker.name}</TableCell>
                  {financialFields.map(f => (
                    <TableCell key={f.key}>
                      <Input type="number" value={worker[f.key] as number || ''} onChange={e => handleInputChange(worker.id, f.key, e.target.value)} className="w-24" />
                    </TableCell>
                  ))}
                  <TableCell className="text-green-600">{payrolls[worker.id]?.overtimePay.toFixed(2)}</TableCell>
                  {deductionFields.map(f => (
                    <TableCell key={f.key}>
                      <Input type="number" value={worker[f.key] as number || ''} onChange={e => handleInputChange(worker.id, f.key, e.target.value)} className="w-24" />
                    </TableCell>
                  ))}
                  <TableCell className="text-red-600">{payrolls[worker.id]?.absenceDeduction.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-primary">{payrolls[worker.id]?.netSalary.toFixed(2)}</TableCell>
                  <TableCell className="space-x-2 rtl:space-x-reverse">
                    <Button size="sm" onClick={() => handleSave(worker)}>حفظ</Button>
                    {payrolls[worker.id] && <PredictiveAnalysis worker={worker} payroll={payrolls[worker.id]} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter className="no-print">
          <DialogClose asChild>
            <Button type="button" variant="secondary">إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
