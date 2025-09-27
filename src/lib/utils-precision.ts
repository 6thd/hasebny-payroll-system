import { type Worker, type PayrollData } from "@/types";

/**
 * Financial precision utilities using integer-based calculations (cents)
 * This approach avoids floating-point precision errors by working in the smallest currency unit
 */

// Constants
const REGULAR_HOURS_PER_DAY = 8;
const CENTS_PER_SAR = 100;

/**
 * Convert SAR amount to cents (integers)
 * @param amount SAR amount as number
 * @returns amount in cents as bigint
 */
export function toCents(amount: number): bigint {
  return BigInt(Math.round(amount * CENTS_PER_SAR));
}

/**
 * Convert cents to SAR amount
 * @param cents amount in cents as bigint
 * @returns SAR amount as number
 */
export function fromCents(cents: bigint): number {
  return Number(cents) / CENTS_PER_SAR;
}

/**
 * Add two SAR amounts in cents
 * @param a amount in cents
 * @param b amount in cents
 * @returns sum in cents
 */
export function addCents(a: bigint, b: bigint): bigint {
  return a + b;
}

/**
 * Subtract two SAR amounts in cents
 * @param a amount in cents
 * @param b amount in cents
 * @returns difference in cents
 */
export function subtractCents(a: bigint, b: bigint): bigint {
  return a - b;
}

/**
 * Multiply SAR amount in cents by a factor
 * @param amount amount in cents
 * @param factor multiplication factor
 * @returns result in cents
 */
export function multiplyCents(amount: bigint, factor: number): bigint {
  return BigInt(Math.round(Number(amount) * factor));
}

/**
 * Divide SAR amount in cents by a divisor
 * @param amount amount in cents
 * @param divisor division divisor
 * @returns result in cents
 */
export function divideCents(amount: bigint, divisor: number): bigint {
  return BigInt(Math.round(Number(amount) / divisor));
}

/**
 * Calculate payroll using integer-based precision arithmetic
 * @param worker Worker data
 * @param year Calculation year
 * @param month Calculation month
 * @returns Payroll calculation results
 */
export function calculatePayrollPrecise(worker: Worker | null, year: number, month: number): PayrollData {
  if (!worker) {
    return { 
      overtimePay: 0, 
      absenceDeduction: 0, 
      netSalary: 0, 
      totalAllowances: 0, 
      grossSalary: 0, 
      totalDeductions: 0 
    };
  }
  
  // Convert all amounts to cents for precise calculations
  const basicSalaryCents = toCents(worker.basicSalary || 0);
  const housingCents = toCents(worker.housing || 0);
  const workNatureCents = toCents(worker.workNature || 0);
  const transportCents = toCents(worker.transport || 0);
  const phoneCents = toCents(worker.phone || 0);
  const foodCents = toCents(worker.food || 0);
  const commissionCents = toCents(worker.commission || 0);
  const advancesCents = toCents(worker.advances || 0);
  const penaltiesCents = toCents(worker.penalties || 0);
  const totalOvertimeHours = worker.totalOvertime || 0;
  const absentDays = worker.absentDays || 0;
  const annualLeaveDays = worker.annualLeaveDays || 0;
  const sickLeaveDays = worker.sickLeaveDays || 0;
  
  // 1. Calculate total allowances (without overtime) to be the basis for deduction
  const totalAllowancesCents = addCents(
    addCents(
      addCents(
        addCents(
          addCents(housingCents, workNatureCents), 
          transportCents
        ), 
        phoneCents
      ), 
      foodCents
    ), 
    commissionCents
  );
  
  const deductibleGrossSalaryCents = addCents(basicSalaryCents, totalAllowancesCents);
  
  // 2. Calculate daily rate (always divided by 30 according to Saudi payroll systems)
  const dailyRateCents = divideCents(deductibleGrossSalaryCents, 30);
  
  // 3. Calculate hourly rate for overtime (based on basic salary only)
  const dailyBasicRateCents = divideCents(basicSalaryCents, 30);
  const hourlyRateCents = divideCents(dailyBasicRateCents, REGULAR_HOURS_PER_DAY);
  
  // 4. Calculate overtime pay (1.5 times hourly rate)
  const overtimePayCents = multiplyCents(
    multiplyCents(hourlyRateCents, totalOvertimeHours), 
    1.5
  );
  
  // 5. Calculate absence and leave deduction
  const absenceAndLeaveDays = absentDays + annualLeaveDays + sickLeaveDays;
  const absenceDeductionCents = multiplyCents(dailyRateCents, absenceAndLeaveDays);
  
  // 6. Calculate gross salary (with overtime)
  const grossSalaryCents = addCents(deductibleGrossSalaryCents, overtimePayCents);
  
  // 7. Calculate total deductions
  const totalDeductionsCents = addCents(
    addCents(absenceDeductionCents, advancesCents), 
    penaltiesCents
  );
  
  // 8. Calculate net salary
  const netSalaryCents = subtractCents(grossSalaryCents, totalDeductionsCents);
  
  // Return results converted back to SAR amounts
  return { 
    overtimePay: parseFloat(fromCents(overtimePayCents).toFixed(2)),
    absenceDeduction: parseFloat(fromCents(absenceDeductionCents).toFixed(2)),
    netSalary: parseFloat(fromCents(netSalaryCents).toFixed(2)),
    totalAllowances: parseFloat(fromCents(totalAllowancesCents).toFixed(2)),
    grossSalary: parseFloat(fromCents(grossSalaryCents).toFixed(2)),
    totalDeductions: parseFloat(fromCents(totalDeductionsCents).toFixed(2)),
  };
}

/**
 * Compare results between standard and precise calculations
 * @param worker Worker data
 * @param year Calculation year
 * @param month Calculation month
 * @returns Comparison results
 */
export function compareCalculations(worker: Worker | null, year: number, month: number): {
  standard: PayrollData;
  precise: PayrollData;
  differences: Record<keyof PayrollData, number>;
} {
  // Import the standard calculation function
  const { calculatePayroll } = require("./utils");
  
  const standard = calculatePayroll(worker, year, month);
  const precise = calculatePayrollPrecise(worker, year, month);
  
  const differences = {
    overtimePay: Math.abs(standard.overtimePay - precise.overtimePay),
    absenceDeduction: Math.abs(standard.absenceDeduction - precise.absenceDeduction),
    netSalary: Math.abs(standard.netSalary - precise.netSalary),
    totalAllowances: Math.abs(standard.totalAllowances - precise.totalAllowances),
    grossSalary: Math.abs(standard.grossSalary - precise.grossSalary),
    totalDeductions: Math.abs(standard.totalDeductions - precise.totalDeductions),
  };
  
  return { standard, precise, differences };
}