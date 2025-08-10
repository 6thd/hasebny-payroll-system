import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Worker, type PayrollData, DayData } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const REGULAR_HOURS_PER_DAY = 8;

export function calculatePayroll(worker: Worker | null, year: number, month: number): PayrollData {
  if (!worker) {
    return { overtimePay: 0, absenceDeduction: 0, netSalary: 0, totalAllowances: 0, grossSalary: 0, totalDeductions: 0 };
  }
  
  // 1. حساب إجمالي الاستحقاقات (بدون العمل الإضافي) ليكون أساس الخصم
  const totalAllowances = (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0) + (worker.commission || 0);
  const deductibleGrossSalary = (worker.basicSalary || 0) + totalAllowances;
  
  // 2. حساب معدل الأجر اليومي
  //    (يتم القسمة على 30 دائماً حسب المتبع في أنظمة الرواتب السعودية)
  const dailyRate = deductibleGrossSalary / 30;
  
  // 3. حساب قيمة خصم الغياب والإجازات
  const hourlyRate = ((worker.basicSalary || 0) / 30) / REGULAR_HOURS_PER_DAY; // أجر الإضافي يحسب على الأساسي فقط
  const overtimePay = (worker.totalOvertime || 0) * hourlyRate * 1.5;
  const absenceAndLeaveDays = (worker.absentDays || 0) + (worker.annualLeaveDays || 0) + (worker.sickLeaveDays || 0);
  const absenceDeduction = dailyRate * absenceAndLeaveDays;

  // 4. حساب إجمالي الاستحقاقات
  const grossSalary = deductibleGrossSalary + overtimePay;

  // 5. حساب إجمالي الاستقطاعات
  const totalDeductions = absenceDeduction + (worker.advances || 0) + (worker.penalties || 0);
  
  // 6. حساب صافي الراتب
  const netSalary = grossSalary - totalDeductions;
  
  return { 
      overtimePay: parseFloat(overtimePay.toFixed(2)),
      absenceDeduction: parseFloat(absenceDeduction.toFixed(2)),
      netSalary: parseFloat(netSalary.toFixed(2)),
      totalAllowances: parseFloat(totalAllowances.toFixed(2)),
      grossSalary: parseFloat(grossSalary.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
  };
}


export function processWorkerData(worker: Worker, year: number, month: number): Worker {
  if (!worker || typeof worker.days === 'undefined') {
    return { ...worker, totalRegular: 0, totalOvertime: 0, absentDays: 0, annualLeaveDays: 0, sickLeaveDays: 0 };
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalRegular = 0, totalOvertime = 0, absentDays = 0, annualLeaveDays = 0, sickLeaveDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = worker.days[day];
    if (dayData) {
      switch (dayData.status) {
        case 'present':
          totalRegular += dayData.regularHours || 0;
          totalOvertime += dayData.overtimeHours || 0;
          break;
        case 'absent':
          absentDays++;
          break;
        case 'annual_leave':
          annualLeaveDays++;
          break;
        case 'sick_leave':
          sickLeaveDays++;
          break;
        default:
          break;
      }
    }
  }
  return { ...worker, totalRegular, totalOvertime, absentDays, annualLeaveDays, sickLeaveDays };
}

export function getFridaysInMonth(year: number, month: number): number[] {
    const fridays = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        if (new Date(year, month, day).getDay() === 5) {
            fridays.push(day);
        }
    }
    return fridays;
}

export const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export function getAttendanceStatusForDay(dayData: DayData | undefined, isFriday: boolean): 'present' | 'absent' | 'on_leave' | 'weekend' | 'no_data' {
    if (isFriday) return 'weekend';
    if (!dayData) return 'no_data';
    
    switch (dayData.status) {
        case 'present':
            return 'present';
        case 'absent':
            return 'absent';
        case 'annual_leave':
        case 'sick_leave':
            return 'on_leave';
        default:
            return 'no_data';
    }
}
