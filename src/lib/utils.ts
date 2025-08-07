import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Worker, type PayrollData } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const REGULAR_HOURS_PER_DAY = 8;

export function calculatePayroll(worker: Worker | null, year: number, month: number): PayrollData {
  if (!worker) {
    return { overtimePay: 0, absenceDeduction: 0, netSalary: 0, totalAllowances: 0, grossSalary: 0, totalDeductions: 0 };
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyRate = (worker.basicSalary || 0) / daysInMonth;
  const hourlyRate = dailyRate / REGULAR_HOURS_PER_DAY;

  const overtimePay = (worker.totalOvertime || 0) * hourlyRate * 1.5;
  // Only deduct for days explicitly marked as 'absent'
  const absenceDeduction = (worker.absentDays || 0) * dailyRate;
  
  const totalAllowances = (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0) + (worker.commission || 0);
  const totalDeductions = (worker.advances || 0) + (worker.penalties || 0) + absenceDeduction;
  
  const grossSalary = (worker.basicSalary || 0) + totalAllowances + overtimePay;
  const netSalary = grossSalary - totalDeductions;

  return { overtimePay, absenceDeduction, netSalary, totalAllowances, grossSalary, totalDeductions };
}

export function processWorkerData(worker: Worker, year: number, month: number): Worker {
  if (!worker || typeof worker.days === 'undefined') return { ...worker, totalRegular: 0, totalOvertime: 0, absentDays: 0 };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalRegular = 0, totalOvertime = 0, absentDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = worker.days[day];
    if (dayData) {
      if (dayData.status === 'present') {
        totalRegular += dayData.regularHours || 0;
        totalOvertime += dayData.overtimeHours || 0;
      } else if (dayData.status === 'absent') {
        absentDays++;
      }
      // Note: 'annual_leave' and 'sick_leave' are not counted as absent.
    }
  }
  return { ...worker, totalRegular, totalOvertime, absentDays };
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
