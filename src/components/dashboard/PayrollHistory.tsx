
import React from 'react';
import { PayrollData } from '@/types';

interface PayrollHistoryProps {
  payrollHistory: PayrollData[];
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({ payrollHistory }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">سجل الرواتب</h2>
      {/* Render payroll history, e.g., in a table */}
      <table>
        <thead>
          <tr>
            <th>الشهر</th>
            <th>السنة</th>
            <th>الراتب الصافي</th>
          </tr>
        </thead>
        <tbody>
          {payrollHistory.map((payroll, index) => (
            <tr key={index}>
              <td>{payroll.month}</td>
              <td>{payroll.year}</td>
              <td>{payroll.netSalary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
