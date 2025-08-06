import type { User as FirebaseUser } from 'firebase/auth';

export interface DayData {
  status: 'present' | 'sick_leave' | 'annual_leave' | 'absent';
  in?: string;
  out?: string;
  regularHours?: number;
  overtimeHours?: number;
}

export interface Worker {
  id: string;
  authUid?: string;
  name: string;
  email?: string;
  role: 'admin' | 'employee';
  department?: string;
  jobTitle?: string;
  shift?: string;
  basicSalary: number;
  housing: number;
  workNature: number;
  transport: number;
  phone: number;
  food: number;
  commission: number;
  advances: number;
  penalties: number;
  days: { [day: number]: DayData };
  totalRegular?: number;
  totalOvertime?: number;
  absentDays?: number;
}

export type AppUser = FirebaseUser & Worker;

export interface PayrollData {
  overtimePay: number;
  absenceDeduction: number;
  netSalary: number;
  totalAllowances: number;
  grossSalary: number;
  totalDeductions: number;
}
