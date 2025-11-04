'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPayrollDetails, saveMonthlyData } from '@/app/actions/employee-actions';
import { toast } from 'sonner';
import { type Worker, type MonthlyData, PayrollData } from '@/types';
import { calculatePayroll, MONTHS, processWorkerData } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorkers: Worker[];
  year: number;
  month: number;
}

export default function PayrollModal({ isOpen, onClose, initialWorkers, year, month }: PayrollModalProps) {
  const queryClient = useQueryClient();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [payroll, setPayroll] = useState<Partial<PayrollData>>({});
  const [monthlyData, setMonthlyData] = useState<Partial<MonthlyData>>({});
  const [serverError, setServerError] = useState<string | null>(null); // State to hold the specific server error

  // When the modal closes, reset everything.
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployeeId(null);
      setPayroll({});
      setMonthlyData({});
      setServerError(null); // Reset server error on close
      queryClient.removeQueries({ queryKey: ['payrollDetails']});
    }
  }, [isOpen, queryClient]);

  // Single, unified query to fetch all data. This is the definitive fix.
  const { data: payrollDetails, isLoading, isError, isSuccess } = useQuery({
    queryKey: ['payrollDetails', selectedEmployeeId, year, month],
    queryFn: () => getPayrollDetails({ employeeId: selectedEmployeeId!, year, month }),
    enabled: !!selectedEmployeeId,
  });

  // Effect to process the data once it's successfully fetched
  useEffect(() => {
    if (isSuccess && payrollDetails) {
      if (payrollDetails.error) {
        // If there's an error from the server, store it and reset data
        setServerError(payrollDetails.error);
        setPayroll({});
        setMonthlyData({});
        return;
      }
      // If successful, clear any previous errors
      setServerError(null);

      const { worker, monthlyData } = payrollDetails;
      
      if (worker) {
        const processedWorker = processWorkerData(worker, year, month);
        const finalWorkerData = { ...processedWorker, ...monthlyData };
        
        setPayroll(calculatePayroll(finalWorkerData, year, month));
        setMonthlyData(monthlyData || {});
      } else {
        setPayroll({});
        setMonthlyData({});
      }
    }
  }, [isSuccess, payrollDetails, year, month]);


  const mutation = useMutation({
    mutationFn: (data: { employeeId: string; year: number; month: number; monthlyData: Partial<MonthlyData> }) => saveMonthlyData(data),
    onSuccess: () => {
      toast.success('تم حفظ البيانات الشهرية بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['payrollDetails', selectedEmployeeId, year, month] });
      window.dispatchEvent(new CustomEvent('data-updated'));
    },
    onError: (error: Error) => toast.error(`فشل الحفظ: ${error.message}`),
  });

  const handleEmployeeSelection = (employeeId: string) => {
    if (employeeId !== selectedEmployeeId) {
      setServerError(null); // Reset error on new selection
      setSelectedEmployeeId(employeeId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMonthlyData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    if (!selectedEmployeeId) return;
    mutation.mutate({ employeeId: selectedEmployeeId, year, month, monthlyData });
  };

  const renderValue = (value: number | undefined) => (value != null ? value.toFixed(2) : '0.00');
  
  const worker = payrollDetails?.worker;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>مسير الرواتب - {MONTHS[month]} {year}</DialogTitle>
          <DialogDescription>
            اختر موظفًا لعرض تفاصيل راتبه وإجراء التعديلات اللازمة مثل العمولات، السلف، والجزاءات.
          </DialogDescription>
        </DialogHeader>

         <div className="mb-4">
            <Select onValueChange={handleEmployeeSelection} value={selectedEmployeeId || ''}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="اختر موظفًا لعرض كشف الراتب..." />
                </SelectTrigger>
                <SelectContent>
                    {initialWorkers.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>
        ) : (serverError || isError) ? (
           // Display the detailed server error message
           <div className="flex justify-center items-center h-40 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
             <p className="text-red-500 text-center font-mono">{serverError || 'حدث خطأ غير متوقع.'}</p>
           </div>
        ) : isSuccess && worker ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* Payroll Details Sections */}
            <div className="col-span-1 space-y-2 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-3">الاستحقاقات</h3>
                <p><strong>الراتب الأساسي:</strong> {renderValue(payroll.basicSalary)}</p>
                <p><strong>بدل سكن:</strong> {renderValue(worker?.housing)}</p>
                <p><strong>بدل مواصلات:</strong> {renderValue(worker?.transport)}</p>
                <p><strong>بدل طعام:</strong> {renderValue(worker?.food)}</p>
                <hr className="my-2" />
                <p><strong>أجر العمل الإضافي:</strong> {renderValue(payroll.overtimePay)}</p>
                <hr className="my-2" />
                 <div className="space-y-2">
                    <label>عمولات</label>
                    <Input type="number" name="commission" value={monthlyData.commission || ''} onChange={handleInputChange} placeholder="عمولات"/>
                </div>
                <hr className="my-2" />
                <p className="font-bold text-lg">إجمالي الاستحقاقات: {renderValue(payroll.grossSalary)}</p>
            </div>

            <div className="col-span-1 space-y-2 p-4 border rounded-lg">
                 <h3 className="font-semibold text-lg mb-3">الاستقطاعات</h3>
                 <p><strong>خصم الغياب:</strong> {renderValue(payroll.absenceDeduction)}</p>
                 <hr className="my-2" />
                 <div className="space-y-2">
                    <label>سلف</label>
                    <Input type="number" name="advances" value={monthlyData.advances || ''} onChange={handleInputChange} placeholder="سلف"/>
                 </div>
                 <div className="space-y-2">
                    <label>جزاءات</label>
                    <Input type="number" name="penalties" value={monthlyData.penalties || ''} onChange={handleInputChange} placeholder="جزاءات" />
                 </div>
                 <hr className="my-2" />
                 <p className="font-bold text-lg">إجمالي الاستقطاعات: {renderValue(payroll.deductions)}</p>
            </div>

            <div className="col-span-1 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-xl mb-4 text-center">ملخص راتب {worker.name}</h3>
                <div className="flex justify-between items-center text-lg">
                    <span>إجمالي الاستحقاقات</span>
                    <span className="font-bold text-green-600">{renderValue(payroll.grossSalary)}</span>
                </div>
                 <div className="flex justify-between items-center text-lg">
                    <span>إجمالي الاستقطاعات</span>
                    <span className="font-bold text-red-600">{renderValue(payroll.deductions)}</span>
                </div>
                <hr className="my-3 border-t-2"/>
                <div className="flex justify-between items-center text-2xl">
                    <span className="font-bold">صافي الراتب</span>
                    <span className="font-extrabold text-blue-700">{renderValue(payroll.netSalary)}</span>
                </div>
                 <Button onClick={handleSave} className="w-full mt-6" disabled={mutation.isPending}>
                    {mutation.isPending ? 'جار الحفظ...' : 'حفظ التعديلات'}
                </Button>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
