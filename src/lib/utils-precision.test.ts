import { describe, it, expect } from 'vitest';
import { 
  toCents, 
  fromCents, 
  addCents, 
  subtractCents, 
  multiplyCents, 
  divideCents, 
  calculatePayrollPrecise
} from './utils-precision';
import { Worker } from '@/types';

describe('Precision utilities', () => {
  it('converts SAR to cents correctly', () => {
    expect(toCents(1000.50)).toBe(BigInt(100050));
    expect(toCents(0.01)).toBe(BigInt(1));
    expect(toCents(0)).toBe(BigInt(0));
  });

  it('converts cents to SAR correctly', () => {
    expect(fromCents(BigInt(100050))).toBe(1000.50);
    expect(fromCents(BigInt(1))).toBe(0.01);
    expect(fromCents(BigInt(0))).toBe(0);
  });

  it('adds cents correctly', () => {
    expect(addCents(BigInt(100), BigInt(200))).toBe(BigInt(300));
    expect(addCents(BigInt(0), BigInt(500))).toBe(BigInt(500));
  });

  it('subtracts cents correctly', () => {
    expect(subtractCents(BigInt(500), BigInt(200))).toBe(BigInt(300));
    expect(subtractCents(BigInt(100), BigInt(100))).toBe(BigInt(0));
  });

  it('multiplies cents correctly', () => {
    expect(multiplyCents(BigInt(100), 2)).toBe(BigInt(200));
    expect(multiplyCents(BigInt(333), 3)).toBe(BigInt(999));
  });

  it('divides cents correctly', () => {
    expect(divideCents(BigInt(100), 2)).toBe(BigInt(50));
    expect(divideCents(BigInt(999), 3)).toBe(BigInt(333));
  });

  it('calculates payroll with precision', () => {
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

    const result = calculatePayrollPrecise(worker, 2023, 1);
    
    expect(result.grossSalary).toBe(3000);
    expect(result.totalAllowances).toBe(0);
    expect(result.netSalary).toBe(3000);
    expect(result.totalDeductions).toBe(0);
  });
});