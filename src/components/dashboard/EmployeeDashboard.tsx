'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeData } from '@/app/actions/employee-actions';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AttendanceCalendar } from './AttendanceCalendar';
import { PayrollHistory } from './PayrollHistory';
import Charts from './Charts';
import DayDetailsModal from './modals/DayDetailsModal';
import { type DayData, type PayrollData } from '@/types';
import { Button } from '@/components/ui/button';
import { calculateLeaveBalance, type LeaveBalanceOutput } from '@/app/actions/leave-balance';
import { toast } from "sonner";
import { LeaveBalanceResultCard } from './LeaveBalanceResultCard';
import { Timestamp } from 'firebase/firestore';

interface EmployeeDashboardProps {
  employeeId: string;
  currentMonth: number;
  currentYear: number;
}

const getJsDate = (date: string | Date | Timestamp): Date => {
    if (typeof date === 'string') {
        return new Date(date);
    }
    if (date instanceof Timestamp) {
        return date.toDate();
    }
    return date;
};

export default function EmployeeDashboard({ employeeId, currentMonth, currentYear }: EmployeeDashboardProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [leaveBalanceResult, setLeaveBalanceResult] = useState<LeaveBalanceOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employeeData', employeeId, currentYear, currentMonth],
    queryFn: () => getEmployeeData({ employeeId, year: currentYear, month: currentMonth }),
  });

  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData);
    setModalOpen(true);
  };

  const handleCalculateLeave = async () => {
      setIsCalculating(true);
      setLeaveBalanceResult(null);
      try {
          if (!data?.worker) {
            toast.error("بيانات الموظف غير متاحة.");
            return;
          }
          const result = await calculateLeaveBalance({
            worker: data.worker,
            settlementDate: new Date().toISOString(),
          });
          if (result.success && result.data) {
              setLeaveBalanceResult(result.data);
              toast.success("تم حساب رصيد الإجازات بنجاح!");
          } else if (!result.success) {
              toast.error(`خطأ في الحساب: ${result.error}`);
          }
      } catch (e: any) {
          toast.error(`فشل في حساب الرصيد: ${e.message}`);
      } finally {
          setIsCalculating(false);
      }
  }

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <p className="text-center text-red-500">Error: {error.message}</p>;
  if (!data) return <p className="text-center">No data available.</p>;

  const { worker, payrollHistory } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">مرحباً, {worker?.name || 'موظف'}</h1>
          <p className="text-muted-foreground">
            هذه لوحة التحكم الخاصة بك. يمكنك عرض الحضور والرواتب والمزيد.
          </p>
        </div>
         <Button onClick={handleCalculateLeave} disabled={isCalculating}>
            {isCalculating ? 'جارٍ الحساب...' : 'حساب رصيد الإجازات المستحقة'}
        </Button>
      </div>
      
      {leaveBalanceResult && <LeaveBalanceResultCard leaveBalance={leaveBalanceResult} />}

      <AttendanceCalendar 
        days={worker?.days || {}} 
        year={currentYear} 
        month={currentMonth} 
        onDayClick={handleDayClick} 
      />
      
      <PayrollHistory payrollHistory={payrollHistory as PayrollData[]} />
      
      <Charts payrollHistory={payrollHistory as PayrollData[]} />

      {isModalOpen && selectedDay && worker && (
        <DayDetailsModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          worker={worker}
          day={getJsDate(selectedDay.date).getDate()}
          year={currentYear}
          month={currentMonth}
          onDataUpdate={() => refetch()} 
        />
      )}
    </div>
  );
}
