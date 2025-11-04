
import React from 'react';
import { LeaveBalanceOutput } from '@/app/actions/leave-balance'; // Corrected import

interface LeaveBalanceResultCardProps {
  leaveBalance: LeaveBalanceOutput;
}

export const LeaveBalanceResultCard: React.FC<LeaveBalanceResultCardProps> = ({ leaveBalance }) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-100">
      <h2 className="text-lg font-bold mb-4">رصيد الإجازات المستحقة</h2>
      <p><strong>الأيام المستحقة:</strong> {leaveBalance.accruedDays}</p>
      <p><strong>القيمة النقدية:</strong> {leaveBalance.monetaryValue}</p>
    </div>
  );
};
