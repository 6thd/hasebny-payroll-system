"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFridaysInMonth, calculatePayroll, MONTHS } from '@/lib/utils';
import type { Worker, DayData } from '@/types';
import { cn } from '@/lib/utils';
import DayDetailsModal from './modals/DayDetailsModal';
import { ScrollArea } from '../ui/scroll-area';

interface AttendanceTableProps {
  workers: Worker[];
  year: number;
  month: number;
  isAdmin: boolean;
  onDataUpdate: () => void;
}

export default function AttendanceTable({ workers, year, month, isAdmin, onDataUpdate }: AttendanceTableProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    worker: Worker | null;
    day: number | null;
  }>({ isOpen: false, worker: null, day: null });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const fridays = getFridaysInMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const CURRENCY = 'ريال';

  const handleDayCellClick = (worker: Worker, day: number) => {
    if (isAdmin) {
      setModalState({ isOpen: true, worker, day });
    }
  };

  const getCellClass = (dayData: DayData | undefined, isFriday: boolean) => {
    let cellClass = '';
    if (dayData) {
      switch (dayData.status) {
        case 'sick_leave': cellClass = 'bg-yellow-200 dark:bg-yellow-900'; break;
        case 'annual_leave': cellClass = 'bg-blue-200 dark:bg-blue-900'; break;
        case 'absent': cellClass = 'bg-red-200 dark:bg-red-900'; break;
        default: break;
      }
    }
    if (isFriday) cellClass += ' bg-slate-200 dark:bg-slate-700';
    return cellClass;
  };
  
  const getCellContent = (dayData: DayData | undefined) => {
    if (!dayData) return '-';
    switch (dayData.status) {
      case 'present':
        const totalHours = (dayData.regularHours || 0) + (dayData.overtimeHours || 0);
        return totalHours > 0 ? totalHours.toFixed(1) : '-';
      case 'sick_leave': return 'م';
      case 'annual_leave': return 'س';
      case 'absent': return 'غ';
      default: return '-';
    }
  };

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow className="bg-gray-200 text-gray-600 uppercase hover:bg-gray-200">
              <TableHead className="sticky rtl:right-0 ltr:left-0 bg-gray-200 z-10 w-36 text-right">الموظف</TableHead>
              <TableHead className="w-24">ساعات عادية</TableHead>
              <TableHead className="w-24">ساعات إضافية</TableHead>
              <TableHead className="w-24">أيام الغياب</TableHead>
              <TableHead className="text-primary w-32">صافي الراتب</TableHead>
              {daysArray.map(day => (
                <TableHead key={day} className={cn("p-3 w-12 text-center", fridays.includes(day) && 'bg-slate-300')}>
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200">
            {workers.map(worker => {
              const { netSalary } = calculatePayroll(worker, year, month);
              return (
                <TableRow key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="font-bold sticky rtl:right-0 ltr:left-0 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-gray-800 z-10">{worker.name}</TableCell>
                  <TableCell className="font-medium text-green-700 dark:text-green-400 text-center">{(worker.totalRegular || 0).toFixed(1)}</TableCell>
                  <TableCell className="font-medium text-sky-700 dark:text-sky-400 text-center">{(worker.totalOvertime || 0).toFixed(1)}</TableCell>
                  <TableCell className="font-medium text-destructive text-center">{worker.absentDays || 0}</TableCell>
                  <TableCell className="font-bold text-primary text-center">{netSalary.toFixed(2)} {CURRENCY}</TableCell>
                  {daysArray.map(day => {
                    const dayData = worker.days?.[day];
                    return (
                      <TableCell
                        key={day}
                        className={cn(
                          "p-1 text-center",
                          isAdmin && "cursor-pointer",
                          getCellClass(dayData, fridays.includes(day))
                        )}
                        onClick={() => handleDayCellClick(worker, day)}
                      >
                        {getCellContent(dayData)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {modalState.isOpen && modalState.worker && modalState.day !== null && (
        <DayDetailsModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, worker: null, day: null })}
          worker={modalState.worker}
          day={modalState.day}
          year={year}
          month={month}
          onDataUpdate={onDataUpdate}
        />
      )}
    </>
  );
}
