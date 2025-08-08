'use server';

import { z } from 'zod';
import { collection, getDocs, query, where, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
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

  let baseGratuity = 0;
  if (serviceDurationYears > 5) {
    baseGratuity += 5 * halfMonthSalary;
    baseGratuity += (serviceDurationYears - 5) * fullMonthSalary;
  } else {
    baseGratuity += serviceDurationYears * halfMonthSalary;
  }

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
        break;
    case 'contract_termination_by_employer_article_77':
    case 'contract_termination_by_employee_article_81':
    case 'force_majeure':
        finalGratuity = baseGratuity;
        break;
    case 'termination_article_80':
        finalGratuity = 0;
        break;
    default:
        finalGratuity = baseGratuity; 
        break;
  }

  const totalLeaveEntitlement = serviceDurationYears * ANNUAL_LEAVE_ENTITLEMENT;
  const leaveTaken = await getAnnualLeaveTaken(worker.id, hireDate, lastDayOfWork);
  const remainingLeaveDays = totalLeaveEntitlement - leaveTaken;
  const dailyRate = totalSalary / 30;
  const leaveBalanceValue = Math.max(0, remainingLeaveDays * dailyRate);

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

// --- New Function to Finalize Termination ---
const FinalizeTerminationInputSchema = z.object({
    employeeId: z.string(),
    terminationDate: z.date(),
    reasonForTermination: z.string(),
    results: z.object({
        serviceDurationYears: z.number(),
        baseGratuity: z.number(),
        finalGratuity: z.number(),
        leaveBalanceValue: z.number(),
        totalAmount: z.number(),
    }),
});

export async function finalizeTermination(input: z.infer<typeof FinalizeTerminationInputSchema>) {
    const validation = FinalizeTerminationInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'بيانات غير صالحة.' };
    }
    
    const { employeeId, terminationDate, reasonForTermination, results } = validation.data;

    try {
        const batch = writeBatch(db);

        // 1. Update the main employee document
        const employeeRef = doc(db, 'employees', employeeId);
        batch.update(employeeRef, {
            status: 'Terminated',
            terminationDate: terminationDate.toISOString().split('T')[0],
        });

        // 2. Create a historical record in the sub-collection
        const historyRef = doc(collection(employeeRef, 'serviceHistory'));
        batch.set(historyRef, {
            ...results,
            reasonForTermination,
            terminationDate,
            finalizedAt: serverTimestamp(),
            // finalizedBy: auth.currentUser?.uid // You'd need to get the admin user's ID here
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Error finalizing termination:', error);
        return { success: false, error: 'حدث خطأ أثناء حفظ بيانات إنهاء الخدمة.' };
    }
}
