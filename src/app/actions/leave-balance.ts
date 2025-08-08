'use server';

import { z } from 'zod';
import { differenceInDays, differenceInCalendarMonths, differenceInYears } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Worker } from '@/types';

// Define the policy schema with default values
const PolicySchema = z.object({
  accrualBasis: z.enum(['daily', 'monthly']).default('daily'),
  includeWeekendsInAccrual: z.boolean().default(true), // Note: Saudi law often includes weekends
  excludeUnpaidLeaveFromAccrual: z.boolean().default(true),
  annualEntitlementBefore5Y: z.number().positive().default(21),
  annualEntitlementAfter5Y: z.number().positive().default(30),
});

type LeavePolicy = z.infer<typeof PolicySchema>;

// Define the main input schema for the server action
const LeaveBalanceInputSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required.'),
  policy: PolicySchema.optional(),
});

type LeaveBalanceInput = z.infer<typeof LeaveBalanceInputSchema>;

export type LeaveBalanceOutput = {
  accruedDays: number;
  monetaryValue: number;
  calculationBasis: {
    serviceYears: number;
    annualEntitlement: number;
    periodStartDate: string;
    periodEndDate: string;
    daysCounted: number;
    policy: LeavePolicy;
  };
};

export async function calculateLeaveBalance(input: LeaveBalanceInput): Promise<{ success: true; data: LeaveBalanceOutput } | { success: false; error: string }> {
  const validation = LeaveBalanceInputSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors.toString() };
  }

  const { employeeId } = validation.data;
  // If policy is not provided, use a new object to get defaults
  const policy = validation.data.policy || PolicySchema.parse({});

  try {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      return { success: false, error: 'لم يتم العثور على بيانات الموظف.' };
    }
    const worker = employeeSnap.data() as Worker;

    if (!worker.hireDate) {
      return { success: false, error: 'تاريخ التعيين للموظف غير موجود.' };
    }

    // 1. Determine Accrual Period
    const periodEnd = new Date();
    const hireDate = new Date(worker.hireDate);
    const lastLeaveEndDate = worker.lastLeaveEndDate?.toDate();
    const periodStart = lastLeaveEndDate && lastLeaveEndDate > hireDate ? lastLeaveEndDate : hireDate;

    // 2. Calculate Effective Days in Period
    let daysToConsider = differenceInDays(periodEnd, periodStart);
    if (!policy.includeWeekendsInAccrual) {
        // This is a simplified logic, a more robust solution would iterate through days
        daysToConsider = daysToConsider * (5 / 7);
    }

    let excludedDays = 0;
    if (policy.excludeUnpaidLeaveFromAccrual && worker.excludedPeriods) {
      worker.excludedPeriods.forEach(p => {
        // Ensure the excluded period overlaps with the current accrual period
        const exStart = p.start.toDate() > periodStart ? p.start.toDate() : periodStart;
        const exEnd = p.end.toDate() < periodEnd ? p.end.toDate() : periodEnd;
        if (exEnd > exStart) {
          excludedDays += differenceInDays(exEnd, exStart);
        }
      });
    }
    const effectiveDays = Math.max(0, daysToConsider - excludedDays);

    // 3. Determine Current Annual Entitlement
    const serviceYears = differenceInYears(periodEnd, hireDate);
    const annualEntitlement = serviceYears >= 5 
      ? policy.annualEntitlementAfter5Y 
      : policy.annualEntitlementBefore5Y;
      
    // 4. Calculate Accrued Days
    let accruedDays = 0;
    if (policy.accrualBasis === 'daily') {
        const daysInYear = 365.25; // Account for leap years
        accruedDays = (effectiveDays / daysInYear) * annualEntitlement;
    } else { // 'monthly'
        const monthsInPeriod = differenceInCalendarMonths(periodEnd, periodStart);
        accruedDays = (monthsInPeriod / 12) * annualEntitlement;
    }

    // 5. Calculate Monetary Value
    const monthlySalary = (worker.basicSalary || 0) + (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0);
    const dayRate = monthlySalary / 30;
    const monetaryValue = accruedDays * dayRate;

    // 6. Return detailed results
    const result: LeaveBalanceOutput = {
      accruedDays: parseFloat(accruedDays.toFixed(2)),
      monetaryValue: parseFloat(monetaryValue.toFixed(2)),
      calculationBasis: {
        serviceYears,
        annualEntitlement,
        periodStartDate: periodStart.toISOString().split('T')[0],
        periodEndDate: periodEnd.toISOString().split('T')[0],
        daysCounted: Math.round(effectiveDays),
        policy: policy,
      },
    };
    
    return { success: true, data: result };

  } catch (error) {
    console.error('Error calculating leave balance:', error);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء حساب الرصيد.' };
  }
}
