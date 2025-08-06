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

// New data structures for Firestore

/**
 * Represents an employee in the system.
 * Stored in the 'employees' collection.
 */
export interface Employee {
  id: string; // Document ID
  name: string;
  employeeId: string; // Custom employee ID
  jobTitle: string;
  department: string;
  hireDate: string; // ISO 8601 format (YYYY-MM-DD)
  basicSalary: number;
  // Add other permanent employee details here
}

/**
 * Represents a monthly payslip for an employee.
 * Stored in the 'payslips' collection.
 * Document ID could be something like: `${employeeId}_${year}_${month}`
 */
export interface Payslip {
  id: string; // Document ID
  employeeId: string; // Foreign key to 'employees' collection
  month: number; // 1-12
  year: number;
  grossSalary: number;
  totalDeductions: number;
  totalAdditions: number;
  netSalary: number;
  // You can add detailed breakdowns if needed
  // additions: { overtime: number; bonus: number; };
  // deductions: { tax: number; socialSecurity: number; };
}
