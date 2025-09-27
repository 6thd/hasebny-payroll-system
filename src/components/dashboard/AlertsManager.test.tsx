import { describe, it, expect } from 'vitest';
import type { Worker } from '../../types';

interface AlertItem {
  id: string;
  type: 'contract_expiry' | 'absence_limit' | 'performance_review' | 'payroll_error';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  employeeId?: string;
  employeeName?: string;
  date?: Date;
  action?: () => void;
}

// Mock data for testing
const mockWorkers: Worker[] = [
  {
    id: '1',
    name: 'محمد أحمد',
    employeeId: 'EMP001',
    jobTitle: 'مطور برامج',
    department: 'تقنية المعلومات',
    hireDate: '2020-03-15',
    basicSalary: 8000,
    housing: 2000,
    workNature: 1000,
    transport: 500,
    phone: 200,
    food: 300,
    days: {},
    absentDays: 3,
    annualLeaveDays: 2,
    sickLeaveDays: 1,
    status: 'Active',
    role: 'employee'
  },
  {
    id: '2',
    name: 'فاطمة علي',
    employeeId: 'EMP002',
    jobTitle: 'محللة مالية',
    department: 'المحاسبة',
    hireDate: '2021-07-22',
    basicSalary: 7500,
    housing: 2000,
    workNature: 1000,
    transport: 500,
    phone: 200,
    food: 300,
    days: {},
    absentDays: 8,
    annualLeaveDays: 5,
    sickLeaveDays: 0,
    status: 'Active',
    role: 'employee'
  },
  {
    id: '3',
    name: 'أحمد عبدالله',
    employeeId: 'EMP003',
    jobTitle: 'مدير موارد بشرية',
    department: 'الموارد البشرية',
    hireDate: '2019-05-10',
    terminationDate: '2025-10-15', // Contract ending soon
    basicSalary: -1000, // Negative salary for testing payroll error
    housing: 2000,
    workNature: 1000,
    transport: 500,
    phone: 200,
    food: 300,
    days: {},
    absentDays: 12, // Excessive absences
    annualLeaveDays: 5,
    sickLeaveDays: 0,
    status: 'Active',
    role: 'employee'
  }
];

// Test the alert generation logic
function generateAlerts(workers: Worker[]) {
  const alerts: AlertItem[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Check contract expiries (within 30 days)
  workers.forEach(worker => {
    // Check for contract end date (terminationDate) or if there's a contract end field
    if (worker.terminationDate) {
      const terminationDate = new Date(worker.terminationDate);
      const daysUntilTermination = Math.ceil(
        (terminationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilTermination > 0 && daysUntilTermination <= 30) {
        alerts.push({
          id: `contract-${worker.id}`,
          type: 'contract_expiry',
          severity: daysUntilTermination <= 7 ? 'high' : daysUntilTermination <= 15 ? 'medium' : 'low',
          title: 'انتهاء عقد الموظف قريباً',
          description: `عقد الموظف ${worker.name} سينتهي خلال ${daysUntilTermination} أيام`,
          employeeId: worker.id,
          employeeName: worker.name,
          date: terminationDate
        });
      }
    }
  });
  
  // Check absence limits (more than 5 absences in the current month)
  workers.forEach(worker => {
    if (worker.absentDays && worker.absentDays > 5) {
      const severity = worker.absentDays > 10 ? 'high' : worker.absentDays > 7 ? 'medium' : 'low';
      alerts.push({
        id: `absence-${worker.id}-${currentYear}-${currentMonth}`,
        type: 'absence_limit',
        severity,
        title: 'تجاوز حد الغياب المسموح',
        description: `الموظف ${worker.name} غائب ${worker.absentDays} أيام هذا الشهر`,
        employeeId: worker.id,
        employeeName: worker.name
      });
    }
  });
  
  // Check for upcoming performance reviews (hire date anniversary)
  workers.forEach(worker => {
    if (worker.hireDate) {
      const hireDate = new Date(worker.hireDate);
      const nextReview = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
      
      // If the review date has passed this year, set it for next year
      if (nextReview < today) {
        nextReview.setFullYear(nextReview.getFullYear() + 1);
      }
      
      const daysUntilReview = Math.ceil(
        (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilReview <= 30 && daysUntilReview >= 0) {
        alerts.push({
          id: `review-${worker.id}`,
          type: 'performance_review',
          severity: daysUntilReview <= 7 ? 'high' : daysUntilReview <= 15 ? 'medium' : 'low',
          title: 'اقتراب موعد المراجعة السنوية',
          description: `مراجعة أداء الموظف ${worker.name} خلال ${daysUntilReview} أيام`,
          employeeId: worker.id,
          employeeName: worker.name,
          date: nextReview
        });
      }
    }
  });
  
  // Check for potential payroll errors (more comprehensive checks)
  workers.forEach(worker => {
    let hasPotentialPayrollError = false;
    let errorDescription = '';
    
    // Check for negative basic salary
    if (worker.basicSalary < 0) {
      hasPotentialPayrollError = true;
      errorDescription = `قيمة الراتب الأساسية للموظف ${worker.name} سالبة`;
    }
    // Check for negative allowances
    else if (worker.housing < 0 || worker.workNature < 0 || worker.transport < 0 || 
             worker.phone < 0 || worker.food < 0) {
      hasPotentialPayrollError = true;
      errorDescription = `قيمة إحدى البدلات للموظف ${worker.name} سالبة`;
    }
    // Check for missing required data
    else if (!worker.name || !worker.basicSalary) {
      hasPotentialPayrollError = true;
      errorDescription = `بيانات الموظف ${worker.name || 'غير محدد'} غير مكتملة`;
    }
    
    if (hasPotentialPayrollError) {
      alerts.push({
        id: `payroll-${worker.id}`,
        type: 'payroll_error',
        severity: 'high',
        title: 'خطأ محتمل في حساب الراتب',
        description: errorDescription,
        employeeId: worker.id,
        employeeName: worker.name
      });
    }
  });
  
  return alerts;
}

describe('AlertsManager', () => {
  it('generates contract expiry alerts', () => {
    const alerts = generateAlerts(mockWorkers);
    const contractAlert = alerts.find(alert => alert.type === 'contract_expiry');
    
    expect(contractAlert).toBeDefined();
    expect(contractAlert?.title).toBe('انتهاء عقد الموظف قريباً');
    expect(contractAlert?.employeeName).toBe('أحمد عبدالله');
  });

  it('generates absence limit alerts', () => {
    const alerts = generateAlerts(mockWorkers);
    const absenceAlerts = alerts.filter(alert => alert.type === 'absence_limit');
    
    expect(absenceAlerts.length).toBe(2); // Both فاطمة علي and أحمد عبدالله have excessive absences
    
    const highSeverityAlert = absenceAlerts.find(alert => alert.severity === 'high');
    const mediumSeverityAlert = absenceAlerts.find(alert => alert.severity === 'medium');
    
    expect(highSeverityAlert).toBeDefined();
    expect(highSeverityAlert?.employeeName).toBe('أحمد عبدالله');
    
    expect(mediumSeverityAlert).toBeDefined();
    expect(mediumSeverityAlert?.employeeName).toBe('فاطمة علي');
  });

  it('generates payroll error alerts', () => {
    const alerts = generateAlerts(mockWorkers);
    const payrollError = alerts.find(alert => alert.type === 'payroll_error');
    
    expect(payrollError).toBeDefined();
    expect(payrollError?.severity).toBe('high');
    expect(payrollError?.title).toBe('خطأ محتمل في حساب الراتب');
    expect(payrollError?.employeeName).toBe('أحمد عبدالله');
  });
});