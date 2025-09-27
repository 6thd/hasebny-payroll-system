// WebAssembly payroll calculator wrapper
let wasmModule: any = null;

// Initialize the WebAssembly module
export async function initWasm() {
  if (wasmModule) return wasmModule;

  try {
    // Dynamically import the WebAssembly module
    const wasm = await import('./wasm/payroll_wasm.js');
    await wasm.default();
    wasmModule = wasm;
    return wasmModule;
  } catch (error) {
    console.error('Failed to initialize WebAssembly payroll module:', error);
    throw new Error('WebAssembly payroll module failed to load');
  }
}

// Calculate payroll using WebAssembly
export async function calculatePayrollWasm(worker: any, year: number, month: number) {
  if (!wasmModule) {
    await initWasm();
  }

  try {
    // Call the WebAssembly function
    const result = wasmModule.calculate_payroll(worker, year, month);
    return result;
  } catch (error) {
    console.error('Error calculating payroll with WebAssembly:', error);
    throw error;
  }
}

// Calculate multiple payrolls using WebAssembly
export async function calculateMultiplePayrollsWasm(workers: any[]) {
  if (!wasmModule) {
    await initWasm();
  }

  try {
    // Call the WebAssembly function
    const results = wasmModule.calculate_multiple_payrolls(workers);
    return results;
  } catch (error) {
    console.error('Error calculating multiple payrolls with WebAssembly:', error);
    throw error;
  }
}

// Fallback to JavaScript implementation if WebAssembly is not available
export function calculatePayrollJs(worker: any, year: number, month: number) {
  // This is a copy of the existing JavaScript implementation
  if (!worker) {
    return { overtimePay: 0, absenceDeduction: 0, netSalary: 0, totalAllowances: 0, grossSalary: 0, totalDeductions: 0 };
  }
  
  // 1. Calculate total entitlements (without overtime) to be the basis for deduction
  const totalAllowances = (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0) + (worker.commission || 0);
  const deductibleGrossSalary = (worker.basicSalary || 0) + totalAllowances;
  
  // 2. Calculate daily rate
  //    (Always divided by 30 according to Saudi payroll systems)
  const dailyRate = deductibleGrossSalary / 30;
  
  // 3. Calculate absence and leave deduction value
  const hourlyRate = ((worker.basicSalary || 0) / 30) / 8; // Overtime pay is calculated on basic only
  const overtimePay = (worker.totalOvertime || 0) * hourlyRate * 1.5;
  const absenceAndLeaveDays = (worker.absentDays || 0) + (worker.annualLeaveDays || 0) + (worker.sickLeaveDays || 0);
  const absenceDeduction = dailyRate * absenceAndLeaveDays;

  // 4. Calculate total entitlements
  const grossSalary = deductibleGrossSalary + overtimePay;

  // 5. Calculate total deductions
  const totalDeductions = absenceDeduction + (worker.advances || 0) + (worker.penalties || 0);
  
  // 6. Calculate net salary
  const netSalary = grossSalary - totalDeductions;
  
  return { 
      overtimePay: parseFloat(overtimePay.toFixed(2)),
      absenceDeduction: parseFloat(absenceDeduction.toFixed(2)),
      netSalary: parseFloat(netSalary.toFixed(2)),
      totalAllowances: parseFloat(totalAllowances.toFixed(2)),
      grossSalary: parseFloat(grossSalary.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
  };
}

// Main function that uses WebAssembly if available, otherwise falls back to JavaScript
export async function calculatePayrollAsync(worker: any, year: number, month: number) {
  try {
    // Try to use WebAssembly implementation
    return await calculatePayrollWasm(worker, year, month);
  } catch (error) {
    console.warn('Falling back to JavaScript payroll calculation:', error);
    // Fallback to JavaScript implementation
    return calculatePayrollJs(worker, year, month);
  }
}

// Synchronous version for backward compatibility
export function calculatePayrollSync(worker: any, year: number, month: number) {
  try {
    // Try to use WebAssembly implementation if already loaded
    if (wasmModule) {
      return wasmModule.calculate_payroll(worker, year, month);
    }
  } catch (error) {
    console.warn('WebAssembly not available, using JavaScript payroll calculation:', error);
  }
  
  // Fallback to JavaScript implementation
  return calculatePayrollJs(worker, year, month);
}