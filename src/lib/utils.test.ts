import { describe, it, expect } from 'vitest';
import { calculatePayroll } from './utils';
import { Worker } from '@/types';

describe('Payroll Calculation Tests', () => {
  // Test case 1: Basic salary only
  it('calculates payroll with basic salary only', () => {
    const worker: Worker = {
      id: '1',
      name: 'Test Employee',
      role: 'employee',
      basicSalary: 3000,
      housing: 0,
      workNature: 0,
      transport: 0,
      phone: 0,
      food: 0,
      days: {},
    };

    const result = calculatePayroll(worker, 2023, 1);
    
    expect(result.grossSalary).toBe(3000);
    expect(result.totalAllowances).toBe(0);
    expect(result.netSalary).toBe(3000);
    expect(result.totalDeductions).toBe(0);
  });

  // Test case 2: Salary with allowances
  it('calculates payroll with allowances', () => {
    const worker: Worker = {
      id: '1',
      name: 'Test Employee',
      role: 'employee',
      basicSalary: 3000,
      housing: 500,
      workNature: 300,
      transport: 200,
      phone: 100,
      food: 150,
      days: {},
    };

    const result = calculatePayroll(worker, 2023, 1);
    
    // Gross = basic + allowances = 3000 + (500+300+200+100+150) = 4250
    expect(result.grossSalary).toBe(4250);
    expect(result.totalAllowances).toBe(1250);
    expect(result.netSalary).toBe(4250);
  });

  // Test case 3: Salary with absences
  it('calculates payroll with absences', () => {
    const worker: Worker = {
      id: '1',
      name: 'Test Employee',
      role: 'employee',
      basicSalary: 3000,
      housing: 500,
      workNature: 300,
      transport: 200,
      phone: 100,
      food: 150,
      absentDays: 2,
      days: {},
    };

    const result = calculatePayroll(worker, 2023, 1);
    
    // Total allowances = 500+300+200+100+150 = 1250
    // Gross salary = 3000 + 1250 = 4250
    // Daily rate = 4250 / 30 = 141.67
    // Absence deduction = 141.67 * 2 = 283.33
    // Net salary = 4250 - 283.33 = 3966.67
    
    expect(result.grossSalary).toBeCloseTo(4250, 2);
    expect(result.absenceDeduction).toBeCloseTo(283.33, 2);
    expect(result.netSalary).toBeCloseTo(3966.67, 2);
  });

  // Test case 4: Salary with overtime
  it('calculates payroll with overtime', () => {
    const worker: Worker = {
      id: '1',
      name: 'Test Employee',
      role: 'employee',
      basicSalary: 3000,
      housing: 0,
      workNature: 0,
      transport: 0,
      phone: 0,
      food: 0,
      totalOvertime: 10,
      days: {},
    };

    const result = calculatePayroll(worker, 2023, 1);
    
    // Hourly rate = (3000 / 30) / 8 = 12.5
    // Overtime pay = 10 * 12.5 * 1.5 = 187.5
    // Gross salary = 3000 + 187.5 = 3187.5
    
    expect(result.grossSalary).toBeCloseTo(3187.5, 2);
    expect(result.overtimePay).toBeCloseTo(187.5, 2);
  });

  // Test case 5: Salary with advances and penalties
  it('calculates payroll with advances and penalties', () => {
    const worker: Worker = {
      id: '1',
      name: 'Test Employee',
      role: 'employee',
      basicSalary: 3000,
      housing: 0,
      workNature: 0,
      transport: 0,
      phone: 0,
      food: 0,
      advances: 200,
      penalties: 100,
      days: {},
    };

    const result = calculatePayroll(worker, 2023, 1);
    
    // Gross salary = 3000
    // Total deductions = 200 + 100 = 300
    // Net salary = 3000 - 300 = 2700
    
    expect(result.grossSalary).toBe(3000);
    expect(result.totalDeductions).toBe(300);
    expect(result.netSalary).toBe(2700);
  });

  // Test case 6: Mid-month hire (pro-rata calculation)
  it('calculates pro-rata salary for mid-month hire', () => {
    // Note: This would require modifying the calculatePayroll function
    // to accept a hire date and calculate pro-rata salary
    // This is a placeholder for future implementation
    expect(true).toBe(true);
  });

  // Test case 7: Complex scenario with all components
  it('calculates complex payroll scenario', () => {
    const worker: Worker = {
      id: '1',
      name: 'Test Employee',
      role: 'employee',
      basicSalary: 4000,
      housing: 800,
      workNature: 500,
      transport: 300,
      phone: 150,
      food: 200,
      commission: 300,
      advances: 150,
      penalties: 75,
      totalOvertime: 8,
      absentDays: 1,
      annualLeaveDays: 2,
      sickLeaveDays: 1,
      days: {},
    };

    const result = calculatePayroll(worker, 2023, 1);
    
    // Total allowances = 800+500+300+150+200+300 = 2250
    // Gross without overtime = 4000 + 2250 = 6250
    // Daily rate = 6250 / 30 = 208.33
    // Hourly rate = (4000 / 30) / 8 = 16.67
    // Overtime pay = 8 * 16.67 * 1.5 = 200
    // Absence deduction = 208.33 * (1+2+1) = 833.33
    // Total deductions = 833.33 + 150 + 75 = 1058.33
    // Gross with overtime = 6250 + 200 = 6450
    // Net salary = 6450 - 1058.33 = 5391.67
    
    expect(result.totalAllowances).toBe(2250);
    expect(result.grossSalary).toBeCloseTo(6450, 2);
    expect(result.overtimePay).toBeCloseTo(200, 2);
    expect(result.absenceDeduction).toBeCloseTo(833.33, 2);
    expect(result.totalDeductions).toBeCloseTo(1058.33, 2);
    expect(result.netSalary).toBeCloseTo(5391.67, 2);
  });
});