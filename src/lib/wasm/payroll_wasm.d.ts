// Type definitions for the WebAssembly payroll module
export function calculate_payroll(worker: any, year: number, month: number): any;
export function calculate_multiple_payrolls(workers: any[]): any[];
export default function init(): Promise<void>;