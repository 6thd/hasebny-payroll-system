// Simple test implementation without external dependencies
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

// Simple test function
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error}`);
  }
}

// Simple assertion function
function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeCloseTo(expected: number, precision: number = 2) {
      const factor = Math.pow(10, precision);
      if (Math.round(actual * factor) !== Math.round(expected * factor)) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    }
  };
}

// Test conversion functions
test('converts SAR to cents correctly', () => {
  expect(toCents(1000.50)).toBe(BigInt(100050));
  expect(toCents(0.01)).toBe(BigInt(1));
  expect(toCents(0)).toBe(BigInt(0));
});

test('converts cents to SAR correctly', () => {
  expect(fromCents(BigInt(100050))).toBe(1000.50);
  expect(fromCents(BigInt(1))).toBe(0.01);
  expect(fromCents(BigInt(0))).toBe(0);
});

// Test arithmetic functions
test('adds cents correctly', () => {
  expect(addCents(BigInt(100), BigInt(200))).toBe(BigInt(300));
  expect(addCents(BigInt(0), BigInt(500))).toBe(BigInt(500));
});

test('subtracts cents correctly', () => {
  expect(subtractCents(BigInt(500), BigInt(200))).toBe(BigInt(300));
  expect(subtractCents(BigInt(100), BigInt(100))).toBe(BigInt(0));
});

test('multiplies cents correctly', () => {
  expect(multiplyCents(BigInt(100), 2)).toBe(BigInt(200));
  expect(multiplyCents(BigInt(333), 3)).toBe(BigInt(999));
});

test('divides cents correctly', () => {
  expect(divideCents(BigInt(100), 2)).toBe(BigInt(50));
  expect(divideCents(BigInt(999), 3)).toBe(BigInt(333));
});

// Test payroll calculation with precision
test('calculates payroll with precision', () => {
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

console.log('All precision utility tests completed');