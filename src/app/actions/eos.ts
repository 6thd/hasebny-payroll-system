
'use server';

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb as db } from '@/lib/firebase/admin';
import type { Worker } from '@/types';
import { calculateLeaveBalance } from './leave-balance';
import { calcEOSB } from '@/lib/taxCompliance';


const EndOfServiceInputSchema = z.object({
  worker: z.any(), 
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
  
  const baseGratuity = calcEOSB(totalSalary, serviceDurationYears);

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

  const leaveBalanceResult = await calculateLeaveBalance({ 
      worker: worker,
      settlementDate: lastDayOfWork.toISOString()
  });
  
  if (!leaveBalanceResult.success) {
    return { success: false, error: `خطأ في حساب الإجازات: ${leaveBalanceResult.error}` };
  }

  const leaveBalanceValue = leaveBalanceResult.data.monetaryValue;
  
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
        const employeesRef = db.collection('employees');
        const q = employeesRef.where('id', '==', employeeId);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return { success: false, error: `Employee with ID "${employeeId}" not found.` };
        }

        const employeeDoc = querySnapshot.docs[0];
        const employeeRef = employeeDoc.ref;

        const batch = db.batch();

        batch.update(employeeRef, {
            status: 'Terminated',
            terminationDate: terminationDate.toISOString().split('T')[0],
        });

        const historyRef = employeeRef.collection('serviceHistory').doc();
        batch.set(historyRef, {
            type: 'EndOfService',
            reasonForTermination,
            terminationDate,
            finalizedAt: FieldValue.serverTimestamp(),
            ...results,
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Error finalizing termination:', error);
        return { success: false, error: 'حدث خطأ أثناء حفظ بيانات إنهاء الخدمة.' };
    }
}
