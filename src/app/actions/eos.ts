'use server';

import { z } from 'zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Worker } from '@/types';

const EndOfServiceInputSchema = z.object({
  worker: z.any(), // Not ideal, but passing complex objects to server actions can be tricky with Zod.
  lastDayOfWork: z.date(),
  reasonForTermination: z.enum([
      'resignation', 
      'contract_termination_by_employer_article_77', 
      'contract_termination_by_employee_article_81', 
      'force_majeure', 
      'termination_article_80'
    ]),
});

export type EndOfServiceInput = z.infer<typeof EndOfServiceInputSchema>;

export type EndOfServiceOutput = {
  serviceDurationYears: number;
  baseGratuity: number;
  finalGratuity: number;
  leaveBalanceValue: number;
  totalAmount: number;
};

const ANNUAL_LEAVE_ENTITLEMENT = 30; // Annual leave days per year

async function getAnnualLeaveTaken(employeeId: string, serviceStartDate: Date, serviceEndDate: Date): Promise<number> {
    const q = query(
        collection(db, 'leaveRequests'),
        where('employeeId', '==', employeeId),
        where('status', '==', 'approved'),
        where('leaveType', '==', 'annual')
    );

    const approvedLeavesSnap = await getDocs(q);
    let daysTaken = 0;
    approvedLeavesSnap.forEach(doc => {
        const req = doc.data();
        const reqStart = req.startDate.toDate();
        // Only count leaves within the service period
        if (reqStart >= serviceStartDate && reqStart <= serviceEndDate) {
            const reqEnd = req.endDate.toDate();
            daysTaken += (reqEnd.getTime() - reqStart.getTime()) / (1000 * 3600 * 24) + 1;
        }
    });
    return daysTaken;
}

export async function calculateEndOfService(input: EndOfServiceInput): Promise<{ success: true; data: EndOfServiceOutput } | { success: false; error: string }> {
  const validation = EndOfServiceInputSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors.toString() };
  }

  const { worker, lastDayOfWork, reasonForTermination } = validation.data as { worker: Worker, lastDayOfWork: Date, reasonForTermination: EndOfServiceInput['reasonForTermination'] };

  if (!worker.hireDate) {
    return { success: false, error: "Missing hire date for the employee." };
  }

  const hireDate = new Date(worker.hireDate);
  const serviceDurationInMillis = lastDayOfWork.getTime() - hireDate.getTime();
  const serviceDurationInDays = serviceDurationInMillis / (1000 * 60 * 60 * 24);
  const serviceDurationYears = serviceDurationInDays / 365.25;

  const totalSalary = (worker.basicSalary || 0) + (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0);
  const halfMonthSalary = totalSalary / 2;
  const fullMonthSalary = totalSalary;

  // 1. Calculate base gratuity based on Article 84
  let baseGratuity = 0;
  if (serviceDurationYears > 5) {
    baseGratuity += 5 * halfMonthSalary; // First 5 years
    baseGratuity += (serviceDurationYears - 5) * fullMonthSalary; // Remaining years
  } else {
    baseGratuity += serviceDurationYears * halfMonthSalary; // Less than or equal to 5 years
  }

  // 2. Adjust gratuity based on termination reason
  let finalGratuity = 0;
  
  switch (reasonForTermination) {
    case 'resignation':
        if (serviceDurationYears >= 2 && serviceDurationYears < 5) {
            finalGratuity = baseGratuity / 3;
        } else if (serviceDurationYears >= 5 && serviceDurationYears < 10) {
            finalGratuity = baseGratuity * (2 / 3);
        } else if (serviceDurationYears >= 10) {
            finalGratuity = baseGratuity;
        }
        // If < 2 years, finalGratuity remains 0
        break;

    case 'contract_termination_by_employer_article_77':
    case 'contract_termination_by_employee_article_81': // As per Article 81, employee is entitled to full gratuity
    case 'force_majeure':
        finalGratuity = baseGratuity;
        break;

    case 'termination_article_80':
        // As per Article 80, if the employee is terminated for one of the listed reasons, they are not entitled to any gratuity.
        finalGratuity = 0;
        break;

    default:
        finalGratuity = baseGratuity; // Default case, assume full gratuity
        break;
  }


  // 3. Calculate leave balance value
  const totalLeaveEntitlement = serviceDurationYears * ANNUAL_LEAVE_ENTITLEMENT;
  const leaveTaken = await getAnnualLeaveTaken(worker.id, hireDate, lastDayOfWork);
  const remainingLeaveDays = totalLeaveEntitlement - leaveTaken;
  const dailyRate = totalSalary / 30; // As per Saudi Labor Law for leave calculation
  const leaveBalanceValue = Math.max(0, remainingLeaveDays * dailyRate);


  // 4. Calculate total amount
  const totalAmount = finalGratuity + leaveBalanceValue;
  
  const result: EndOfServiceOutput = {
    serviceDurationYears: parseFloat(serviceDurationYears.toFixed(2)),
    baseGratuity: parseFloat(baseGratuity.toFixed(2)),
    finalGratuity: parseFloat(finalGratuity.toFixed(2)),
    leaveBalanceValue: parseFloat(leaveBalanceValue.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };

  return { success: true, data: result };
}
