"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MONTHS, calculatePayroll } from '@/lib/utils';
import type { Worker } from '@/types';
import AttendanceTable from './AttendanceTable';
import LeaveRequestForm, { type LeaveRequestFormValues } from './LeaveRequestForm';
import { FilePlus2, Loader2 } from 'lucide-react';
import EmployeeLeaveHistory from './EmployeeLeaveHistory';
import { calculateLeaveBalance } from '@/app/actions/leave-balance';
import { submitLeaveRequest } from '@/app/actions/leave';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface EmployeeDashboardProps {
  employee: Worker;
  year: number;
  month: number;
  onDateChange: (newDate: { year: number; month: number }) => void;
  onDataUpdate: () => void;
}

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-primary">{value}</div>
    </CardContent>
  </Card>
);

interface LeaveModalState {
    isOpen: boolean;
    isLoading: boolean;
    balance: number | null;
}

export default function EmployeeDashboard({ employee, year, month, onDateChange, onDataUpdate }: EmployeeDashboardProps) {
  const [leaveModalState, setLeaveModalState] = useState<LeaveModalState>({ isOpen: false, isLoading: false, balance: null });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  if (!employee) {
    return <div className="text-center text-red-500">لا يمكن تحميل بيانات الموظف.</div>;
  }
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const { netSalary } = calculatePayroll(employee, year, month);
  const CURRENCY = 'ريال';
  
  const handleOpenLeaveModal = async () => {
      setLeaveModalState({ ...leaveModalState, isLoading: true });
      try {
          const result = await calculateLeaveBalance({ employeeId: employee.id });
          if (result.success) {
              setLeaveModalState({ isOpen: true, isLoading: false, balance: result.data.accruedDays });
          } else {
              toast({ title: "خطأ", description: result.error, variant: "destructive" });
              setLeaveModalState({ isOpen: false, isLoading: false, balance: null });
          }
      } catch (error) {
          toast({ title: "خطأ", description: "لم نتمكن من جلب رصيد الإجازات.", variant: "destructive" });
          setLeaveModalState({ isOpen: false, isLoading: false, balance: null });
      }
  };

  const handleCloseLeaveModal = () => {
    setLeaveModalState({ isOpen: false, isLoading: false, balance: null });
  };

  const handleLeaveSubmit = async (data: LeaveRequestFormValues) => {
    if (!user) {
      toast({ title: "خطأ", description: "يجب أن تكون مسجلاً لتقديم طلب.", variant: "destructive" });
      return;
    }

    setIsSubmittingLeave(true);
    const result = await submitLeaveRequest({
      ...data,
      employeeId: user.id,
      employeeName: user.name || user.email || 'غير معروف',
    });
    setIsSubmittingLeave(false);

    if (result.success) {
      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب الإجازة بنجاح للمراجعة.",
      });
      handleCloseLeaveModal();
      onDataUpdate();
    } else {
      console.error("Error submitting leave request: ", result.error);
      const errorMessage = typeof result.error === 'string' 
        ? result.error
        : "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.";
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>نظرة عامة على راتب شهر {MONTHS[month]} {year}</CardTitle>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Select
                value={String(month)}
                onValueChange={(value) => onDateChange({ year, month: Number(value) })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(year)}
                onValueChange={(value) => onDateChange({ month, year: Number(value) })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="صافي الراتب" value={`${netSalary.toFixed(2)} ${CURRENCY}`} />
          <StatCard title="أيام الغياب" value={employee.absentDays || 0} />
          <StatCard title="ساعات العمل الإضافي" value={(employee.totalOvertime || 0).toFixed(1)} />
           <Button className="h-full text-lg" onClick={handleOpenLeaveModal} disabled={leaveModalState.isLoading}>
                {leaveModalState.isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                    <FilePlus2 className="mr-2 h-6 w-6" />
                )}
                {leaveModalState.isLoading ? 'جارٍ التحميل...' : 'تقديم طلب إجازة'}
            </Button>
        </CardContent>
      </Card>
      
      <Dialog open={leaveModalState.isOpen} onOpenChange={handleCloseLeaveModal}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>تقديم طلب إجازة</DialogTitle>
            </DialogHeader>
            <LeaveRequestForm 
              onSubmit={handleLeaveSubmit}
              isSubmitting={isSubmittingLeave} 
              currentBalance={leaveModalState.balance} 
            />
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>جدول الحضور لشهر {MONTHS[month]} {year}</CardTitle>
        </CardHeader>
        <CardContent>
            <AttendanceTable
            workers={[employee]}
            year={year}
            month={month}
            isAdmin={false}
            onDataUpdate={onDataUpdate}
          />
        </CardContent>
      </Card>

      <EmployeeLeaveHistory employeeId={employee.id} />
    </div>
  );
}
