"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MONTHS, calculatePayroll, getFridaysInMonth } from '@/lib/utils';
import type { Worker } from '@/types';
import AttendanceTable from './AttendanceTable';
import LeaveRequestForm from './LeaveRequestForm';

interface EmployeeDashboardProps {
  employee: Worker;
  year: number;
  month: number;
  onDateChange: (newDate: { year: number; month: number }) => void;
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


export default function EmployeeDashboard({ employee, year, month, onDateChange }: EmployeeDashboardProps) {
  if (!employee) {
    return <div className="text-center text-red-500">لا يمكن تحميل بيانات الموظف.</div>;
  }
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const { netSalary } = calculatePayroll(employee, year, month);
  const CURRENCY = 'ريال';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>نظرة عامة على راتب شهر {MONTHS[month]} {year}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
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
            <StatCard title="صافي الراتب" value={`${netSalary.toFixed(2)} ${CURRENCY}`} />
            <StatCard title="أيام الغياب" value={employee.absentDays || 0} />
            <StatCard title="ساعات العمل الإضافي" value={(employee.totalOvertime || 0).toFixed(1)} />
          </CardContent>
        </Card>
        
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
              onDataUpdate={() => {}}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <LeaveRequestForm employeeId={employee.id} />
      </div>
    </div>
  );
}
