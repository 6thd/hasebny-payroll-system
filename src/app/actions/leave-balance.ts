
'use server';

import { z } from 'zod';
import { differenceInDays, differenceInCalendarMonths, differenceInYears } from 'date-fns';
import type { Worker } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

// Helper to safely convert Firestore Timestamps, ISO strings, or Date objects to JS Date
const getJsDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Timestamp) return date.toDate();
    if (date.toDate && typeof date.toDate === 'function') return date.toDate(); // For client-side timestamps
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d;
    return undefined;
};

const WorkerObjectSchema = z.any();

const PolicySchema = z.object({
  accrualBasis: z.enum(['daily', 'monthly']).default('daily'),
  includeWeekendsInAccrual: z.boolean().default(true),
  excludeUnpaidLeaveFromAccrual: z.boolean().default(true),
  annualEntitlementBefore5Y: z.number().positive().default(21),
  annualEntitlementAfter5Y: z.number().positive().default(30),
});

type LeavePolicy = z.infer<typeof PolicySchema>;

const LeaveBalanceInputSchema = z.object({
  worker: WorkerObjectSchema, 
  settlementDate: z.union([z.string(), z.date()]).refine((date) => !isNaN(new Date(date).getTime()), { message: 'Invalid settlement date.' }),
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
    return { success: false, error: JSON.stringify(validation.error.flatten().fieldErrors) };
  }

  const { worker, settlementDate, policy: optionalPolicy } = validation.data;
  const policy = optionalPolicy || PolicySchema.parse({});

  try {
    // Consistent and safe date handling for all date inputs.
    const hiringDate = getJsDate(worker.hiringDate);
    const periodEnd = getJsDate(settlementDate);
    const lastSettlementDate = getJsDate(worker.leaveBalance?.lastSettlementDate);

    if (!hiringDate) {
      return { success: false, error: 'تاريخ التعيين للموظف غير موجود أو غير صالح.' };
    }
    if (!periodEnd) {
        return { success: false, error: 'تاريخ التسوية المحدد غير صالح.' };
    }

    const periodStart = lastSettlementDate && lastSettlementDate > hiringDate ? lastSettlementDate : hiringDate;

    let daysToConsider = differenceInDays(periodEnd, periodStart);
    if (daysToConsider < 0) daysToConsider = 0;

    if (!policy.includeWeekendsInAccrual) {
        daysToConsider = daysToConsider * (5 / 7);
    }

    let excludedDays = 0;
    if (policy.excludeUnpaidLeaveFromAccrual && worker.excludedPeriods) {
      worker.excludedPeriods.forEach((p: { start: any; end: any; }) => {
        const exStart = getJsDate(p.start);
        const exEnd = getJsDate(p.end);
        if (exStart && exEnd) {
            const effectiveExStart = exStart > periodStart ? exStart : periodStart;
            const effectiveExEnd = exEnd < periodEnd ? exEnd : periodEnd;
            if (effectiveExEnd > effectiveExStart) {
              excludedDays += differenceInDays(effectiveExEnd, effectiveExStart);
            }
        }
      });
    }
    const effectiveDays = Math.max(0, daysToConsider - excludedDays);

    const serviceYears = differenceInYears(periodEnd, hiringDate);
    const annualEntitlement = serviceYears >= 5 
      ? policy.annualEntitlementAfter5Y 
      : policy.annualEntitlementBefore5Y;
      
    let accruedDays = 0;
    if (policy.accrualBasis === 'daily') {
        const daysInYear = 365.25; // Account for leap years
        accruedDays = (effectiveDays / daysInYear) * annualEntitlement;
    } else { // monthly
        const monthsInPeriod = differenceInCalendarMonths(periodEnd, periodStart);
        accruedDays = (monthsInPeriod / 12) * annualEntitlement;
    }

    const monthlySalary = (worker.basicSalary || 0) + (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0);
    const dayRate = monthlySalary / 30;
    const monetaryValue = accruedDays * dayRate;

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

  } catch (error: any) {
    console.error('Root Error in calculateLeaveBalance:', error);
    return { success: false, error: `An unexpected server error occurred during calculation: ${error.message}` };
  }
}
