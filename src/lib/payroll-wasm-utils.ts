import { type Worker, type PayrollData } from "@/types";
import { calculatePayrollWasm, calculatePayrollJs, initWasm } from "./payroll-wasm";

// Enhanced payroll calculation function that uses WebAssembly when available
export async function calculatePayrollEnhanced(worker: Worker | null, year: number, month: number): Promise<PayrollData> {
  if (!worker) {
    return { overtimePay: 0, absenceDeduction: 0, netSalary: 0, totalAllowances: 0, grossSalary: 0, totalDeductions: 0 };
  }

  try {
    // Try to use WebAssembly implementation
    return await calculatePayrollWasm(worker, year, month);
  } catch (error) {
    console.warn('Falling back to JavaScript payroll calculation:', error);
    // Fallback to JavaScript implementation
    return calculatePayrollJs(worker, year, month);
  }
}

// Initialize WebAssembly module asynchronously
export async function initializePayrollWasm() {
  try {
    await initWasm();
    console.log('WebAssembly payroll module initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize WebAssembly payroll module:', error);
    return false;
  }
}