import { describe, it, expect } from 'vitest';
import { calculateProRataSalary, calculateProRataSalaryActualDays } from './payroll-calculations';

describe('Payroll calculations', () => {
  it('calculates pro-rated salary for mid-month hire (Saudi standard)', () => {
    // Test case: Employee with 3000 SAR monthly salary joining on day 16 of a 30-day month
    const monthlySalary = 3000;
    const startDay = 16;
    const daysInMonth = 30;
    
    const result = calculateProRataSalary(monthlySalary, startDay, daysInMonth);
    
    // Days worked = 30 - 16 + 1 = 15 days
    // Daily rate (Saudi standard) = 3000 / 30 = 100 SAR
    // Pro-rated salary = 100 * 15 = 1500 SAR
    expect(result).toBe(1500);
  });

  it('calculates pro-rated salary for beginning of month hire', () => {
    // Employee joining on first day should get full salary
    const monthlySalary = 3000;
    const startDay = 1;
    const daysInMonth = 30;
    
    const result = calculateProRataSalary(monthlySalary, startDay, daysInMonth);
    
    // Days worked = 30 - 1 + 1 = 30 days
    // Daily rate = 3000 / 30 = 100 SAR
    // Pro-rated salary = 100 * 30 = 3000 SAR
    expect(result).toBe(3000);
  });

  it('calculates pro-rated salary for end of month hire', () => {
    // Employee joining on last day should get 1 day salary
    const monthlySalary = 3000;
    const startDay = 30;
    const daysInMonth = 30;
    
    const result = calculateProRataSalary(monthlySalary, startDay, daysInMonth);
    
    // Days worked = 30 - 30 + 1 = 1 day
    // Daily rate = 3000 / 30 = 100 SAR
    // Pro-rated salary = 100 * 1 = 100 SAR
    expect(result).toBe(100);
  });

  it('calculates pro-rated salary using actual days in month', () => {
    // Employee with 3000 SAR monthly salary joining on day 16 of a 31-day month
    const monthlySalary = 3000;
    const startDay = 16;
    const daysInMonth = 31;
    
    const result = calculateProRataSalaryActualDays(monthlySalary, startDay, daysInMonth);
    
    // Days worked = 31 - 16 + 1 = 16 days
    // Daily rate (actual) = 3000 / 31 ≈ 96.77 SAR
    // Pro-rated salary = 96.77 * 16 ≈ 1548.39 SAR
    expect(result).toBeCloseTo(1548.39, 2);
  });

  it('throws error for invalid start day', () => {
    const monthlySalary = 3000;
    const startDay = 32; // Invalid day
    const daysInMonth = 30;
    
    expect(() => calculateProRataSalary(monthlySalary, startDay, daysInMonth))
      .toThrow('Start day must be between 1 and days in month');
  });
});