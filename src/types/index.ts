
import { Timestamp } from "firebase/firestore";

// Core Data Structures

export interface Worker {
  id: string;
  name: string;
  jobTitle: string;
  joiningDate: Date | string; 
  salary: number;
  contractType: 'fixed' | 'unlimited';
  serviceHistory?: ServiceHistoryItem[];
  [key: string]: any; 
}

export interface AppUser {
  uid: string;
  email?: string | null;
  role: 'admin' | 'employee' | 'hr';
  employeeId?: string;
  workerData?: Worker;
  name?: string;
  id?: string;
  jobTitle?: string;
  department?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  leaveType: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requestedAt: Date;
  createdAt?: Date;
}

export interface DocumentData {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  uploadDate: Date;
  category: string;
  status: string;
  issueDate?: string | Date | Timestamp;
  expiryDate?: string | Date | Timestamp;
}

export interface ServiceHistoryItem {
  id:string;
  startDate: Date | string;
  endDate: Date | string | 'present';
  jobTitle: string;
  salary: number;
  details: string;
  employeeName?: string;
  employeeId?: string;
  companyId?: string; // Added this property
  type?: string;
  finalizedAt?: Date | Timestamp;
  totalAmount?: number;
  monetaryValue?: number;
  reasonForTermination?: string;
  serviceDurationYears?: number;
  finalGratuity?: number;
  leaveBalanceValue?: number;
}

export interface Settlement extends ServiceHistoryItem {}

// Analytics & Payroll Data

export interface MonthlyData {
  month: string;
  [key: string]: any;
}

export interface DayData {
  date: string | Date;
  status: string;
  notes?: string;
  regularHours?: number;
  overtimeHours?: number;
  in?: string;
  out?: string;
}

export interface PayrollData {
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  isPaid: boolean;
  totalAllowances?: number;
  overtimePay?: number;
  absenceDeduction?: number;
  grossSalary?: number;
}

// Calculation & Policy-related Interfaces

export interface LeavePolicy {
  accrualBasis: 'daily' | 'monthly';
  includeWeekendsInAccrual: boolean;
  excludeUnpaidLeaveFromAccrual: boolean;
  annualEntitlementBefore5Y: number;
  annualEntitlementAfter5Y: number;
}

export interface LeaveSettlementCalculation {
  totalAccruedDays: number;
  daysTaken: number;
  remainingLeaveBalance: number;
  cashEquivalent: number;
  details: Record<string, any>;
  accruedDays?: number;
  monetaryValue?: number;
  calculationBasis?: any;
  workerId?: string;
  calculationDate?: Date;
}
