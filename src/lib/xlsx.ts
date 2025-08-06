'use client';

import * as XLSX from 'xlsx';
import type { Worker } from '@/types';
import { calculatePayroll, MONTHS } from './utils';

export const exportToExcel = (workers: Worker[], year: number, month: number) => {
  const monthName = MONTHS[month];
  const tableData = workers.map(worker => {
    const payroll = calculatePayroll(worker, year, month);
    return {
      'الموظف': worker.name,
      'القسم': worker.department || '',
      'الراتب الأساسي': worker.basicSalary || 0,
      'بدل سكن': worker.housing || 0,
      'بدل طبيعة عمل': worker.workNature || 0,
      'بدل مواصلات': worker.transport || 0,
      'بدل هاتف': worker.phone || 0,
      'بدل طعام': worker.food || 0,
      'عمولة': worker.commission || 0,
      'أجر العمل الإضافي': payroll.overtimePay.toFixed(2),
      'سلف': worker.advances || 0,
      'جزاءات': worker.penalties || 0,
      'خصم الغياب': payroll.absenceDeduction.toFixed(2),
      'صافي الراتب': payroll.netSalary.toFixed(2),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `مسير رواتب ${monthName} ${year}`);
  
  XLSX.writeFile(workbook, `مسير_رواتب_${year}_${month + 1}.xlsx`);
};
