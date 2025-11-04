import * as XLSX from 'xlsx';
import { Worker, PayrollData } from '@/types';

const sheetName = 'تصدير الرواتب'; // Sheet name in Arabic

interface ExportPayrollParams {
  workers: Worker[];
  payrollData: { [workerId: string]: PayrollData };
  month: string;
  year: number;
}

export const exportPayrollToExcel = (params: ExportPayrollParams) => {
  const { workers, payrollData, month, year } = params;

  const headers = [
    'الرقم الوظيفي',
    'اسم الموظف',
    'المسمى الوظيفي',
    'الراتب الأساسي',
    'بدل سكن',
    'بدل مواصلات',
    'بدل طعام',
    'بدل طبيعة عمل',
    'عمولات',
    'إجمالي البدلات',
    'أجر العمل الإضافي',
    'إجمالي المستحق',
    'سلف',
    'جزاءات',
    'خصم الغياب',
    'إجمالي الاستقطاعات',
    'صافي الراتب',
  ];

  const data = workers.map(worker => {
    const payroll = payrollData[worker.id];
    return [
      worker.id,
      worker.name,
      worker.jobTitle,
      worker.basicSalary || 0,
      worker.housing || 0,
      worker.transport || 0,
      worker.food || 0,
      worker.workNature || 0,
      payroll?.commission || 0,
      payroll?.allowances || 0,
      payroll?.overtimePay || 0,
      payroll?.grossSalary || 0,
      payroll?.advances || 0,
      payroll?.penalties || 0,
      payroll?.absenceDeduction || 0,
      payroll?.deductions || 0,
      payroll?.netSalary || 0,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Add a title row
  XLSX.utils.sheet_add_aoa(ws, [[`مسير رواتب شهر ${month} ${year}`]], { origin: 'A1' });

  XLSX.writeFile(wb, `payroll-${month}-${year}.xlsx`);
};
