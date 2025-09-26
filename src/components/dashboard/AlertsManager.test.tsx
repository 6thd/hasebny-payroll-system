/**
 * This is a simple test file to demonstrate the functionality of the AlertsManager component.
 * In a real application, this would be replaced with proper unit tests using Jest or a similar framework.
 */

// Import the actual Worker type from the relative path
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
  }
];

// Test the alert generation logic
export function testAlertGeneration() {
  const alerts: AlertItem[] = [];
  
  // Check contract expiries (within 30 days)
  mockWorkers.forEach(worker => {
    if (worker.status === 'Terminated' && worker.terminationDate) {
      const terminationDate = new Date(worker.terminationDate);
      const today = new Date();
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
    
    // Check absence limits (more than 5 absences in a month)
    if (worker.absentDays && worker.absentDays > 5) {
      alerts.push({
        id: `absence-${worker.id}`,
        type: 'absence_limit',
        severity: worker.absentDays > 10 ? 'high' : worker.absentDays > 7 ? 'medium' : 'low',
        title: 'تجاوز حد الغياب المسموح',
        description: `الموظف ${worker.name} غائب ${worker.absentDays} أيام هذا الشهر`,
        employeeId: worker.id,
        employeeName: worker.name
      });
    }
  });
  
  // Check for upcoming performance reviews (hire date anniversary)
  const today = new Date();
  mockWorkers.forEach(worker => {
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
  
  // Check for potential payroll errors (negative net salary)
  mockWorkers.forEach(worker => {
    // In a real implementation, we would calculate payroll here
    // For now, we'll just simulate checking for errors
    const hasPotentialPayrollError = worker.basicSalary < 0;
    
    if (hasPotentialPayrollError) {
      alerts.push({
        id: `payroll-${worker.id}`,
        type: 'payroll_error',
        severity: 'high',
        title: 'خطأ محتمل في حساب الراتب',
        description: `قيمة الراتب الأساسية للموظف ${worker.name} سالبة`,
        employeeId: worker.id,
        employeeName: worker.name
      });
    }
  });
  
  console.log('Generated alerts:', alerts);
  return alerts;
}

// Run the test
testAlertGeneration();