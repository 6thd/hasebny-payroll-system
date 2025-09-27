/**
 * Calculate pro-rated salary for employees who join mid-month
 * @param monthlySalary - Monthly salary in SAR (as number)
 * @param startDay - Day of month when employee started (1-31)
 * @param daysInMonth - Total days in the month (typically 28-31)
 * @returns Pro-rated salary for the partial month
 */
export function calculateProRataSalary(
  monthlySalary: number,
  startDay: number,
  daysInMonth: number
): number {
  // Validate inputs
  if (startDay < 1 || startDay > daysInMonth) {
    throw new Error('Start day must be between 1 and days in month');
  }
  
  // Calculate days worked in the month
  const daysWorked = daysInMonth - startDay + 1;
  
  // Calculate pro-rated salary
  // Using fixed 30-day month calculation as per Saudi payroll practices
  const dailyRate = monthlySalary / 30;
  const proRataSalary = dailyRate * daysWorked;
  
  return parseFloat(proRataSalary.toFixed(2));
}

/**
 * Calculate pro-rated salary using actual days in month
 * @param monthlySalary - Monthly salary in SAR (as number)
 * @param startDay - Day of month when employee started (1-31)
 * @param daysInMonth - Total days in the month (typically 28-31)
 * @returns Pro-rated salary for the partial month
 */
export function calculateProRataSalaryActualDays(
  monthlySalary: number,
  startDay: number,
  daysInMonth: number
): number {
  // Validate inputs
  if (startDay < 1 || startDay > daysInMonth) {
    throw new Error('Start day must be between 1 and days in month');
  }
  
  // Calculate days worked in the month
  const daysWorked = daysInMonth - startDay + 1;
  
  // Calculate pro-rated salary using actual days
  const dailyRate = monthlySalary / daysInMonth;
  const proRataSalary = dailyRate * daysWorked;
  
  return parseFloat(proRataSalary.toFixed(2));
}