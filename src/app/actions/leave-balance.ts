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

// Memoization cache for employee data
const employeeCache = new Map<string, { data: Worker; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Add a timeout wrapper function
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('انتهت مهلة العملية')), timeoutMs)
    )
  ]);
}

export async function calculateLeaveBalance(input: LeaveBalanceInput): Promise<{ success: true; data: LeaveBalanceOutput } | { success: false; error: string }> {
  console.log('calculateLeaveBalance called with input:', input);
  
  const validation = LeaveBalanceInputSchema.safeParse(input);
  if (!validation.success) {
    const error = validation.error.flatten().fieldErrors.toString();
    console.error('Validation failed:', error);
    return { success: false, error };
  }

  const { employeeId } = validation.data;
  // If policy is not provided, use a new object to get defaults
  const policy = validation.data.policy || PolicySchema.parse({});

  // Create the calculation promise
  const calculationPromise = new Promise<{ success: true; data: LeaveBalanceOutput } | { success: false; error: string }>(async (resolve) => {
    try {
      console.log('Starting calculation for employee:', employeeId);
      
      // Check cache first
      let worker: Worker;
      const cached = employeeCache.get(employeeId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        worker = cached.data;
        console.log('Using cached employee data for employee:', employeeId);
      } else {
        console.log('Fetching employee data from Firestore for employee:', employeeId);
        const employeeRef = doc(db, 'employees', employeeId);
        console.log('Created document reference');
        
        const employeeSnap = await getDoc(employeeRef);
        console.log('getDoc completed for employee:', employeeId);

        if (!employeeSnap.exists()) {
          const error = 'لم يتم العثور على بيانات الموظف.';
          console.error('Employee not found:', employeeId);
          resolve({ success: false, error });
          return;
        }
        
        worker = employeeSnap.data() as Worker;
        console.log('Raw worker data from Firestore:', worker);
        
        // Validate required fields
        if (!worker.hireDate) {
          const error = 'تاريخ التعيين للموظف غير موجود.';
          console.error('Missing hireDate for employee:', employeeId);
          resolve({ success: false, error });
          return;
        }
        
        // Cache the data
        employeeCache.set(employeeId, { data: worker, timestamp: now });
        console.log('Cached employee data for employee:', employeeId);
      }

      // Log worker data for debugging
      console.log('Processing worker data:', {
        id: worker.id,
        name: worker.name,
        hireDate: worker.hireDate,
        lastLeaveEndDate: worker.lastLeaveEndDate,
        excludedPeriods: worker.excludedPeriods,
        basicSalary: worker.basicSalary,
        housing: worker.housing,
        workNature: worker.workNature,
        transport: worker.transport,
        phone: worker.phone,
        food: worker.food
      });

      // 1. Determine Accrual Period
      console.log('Step 1: Determine Accrual Period');
      const periodEnd = new Date();
      const hireDate = worker.hireDate ? new Date(worker.hireDate) : new Date();
      const lastLeaveEndDate = worker.lastLeaveEndDate?.toDate();
      const periodStart = lastLeaveEndDate && lastLeaveEndDate > hireDate ? lastLeaveEndDate : hireDate;

      console.log('Calculation period:', { periodStart, periodEnd });

      // 2. Calculate Effective Days in Period
      console.log('Step 2: Calculate Effective Days in Period');
      let daysToConsider = differenceInDays(periodEnd, periodStart);
      
      // Optimize weekend calculation
      if (!policy.includeWeekendsInAccrual) {
          // More efficient calculation: 5/7 of total days
          daysToConsider = Math.floor(daysToConsider * (5 / 7));
      }

      // Optimize excluded days calculation
      console.log('Step 2.1: Calculate excluded days');
      let excludedDays = 0;
      if (policy.excludeUnpaidLeaveFromAccrual && worker.excludedPeriods && worker.excludedPeriods.length > 0) {
        // Process excluded periods more efficiently
        for (const p of worker.excludedPeriods) {
          // Ensure the excluded period overlaps with the current accrual period
          const exStart = p.start.toDate() > periodStart ? p.start.toDate() : periodStart;
          const exEnd = p.end.toDate() < periodEnd ? p.end.toDate() : periodEnd;
          if (exEnd > exStart) {
            excludedDays += differenceInDays(exEnd, exStart);
          }
        }
      }
      
      const effectiveDays = Math.max(0, daysToConsider - excludedDays);
      console.log('Effective days calculation:', { daysToConsider, excludedDays, effectiveDays });

      // 3. Determine Current Annual Entitlement
      console.log('Step 3: Determine Current Annual Entitlement');
      const serviceYears = differenceInYears(periodEnd, hireDate);
      const annualEntitlement = serviceYears >= 5 
        ? policy.annualEntitlementAfter5Y 
        : policy.annualEntitlementBefore5Y;
        
      console.log('Annual entitlement calculation:', { serviceYears, annualEntitlement });

      // 4. Calculate Accrued Days
      console.log('Step 4: Calculate Accrued Days');
      let accruedDays = 0;
      if (policy.accrualBasis === 'daily') {
          const daysInYear = 365.25; // Account for leap years
          accruedDays = (effectiveDays / daysInYear) * annualEntitlement;
      } else { // 'monthly'
          const monthsInPeriod = differenceInCalendarMonths(periodEnd, periodStart);
          accruedDays = (monthsInPeriod / 12) * annualEntitlement;
      }

      console.log('Accrued days calculation:', { accruedDays });

      // 5. Calculate Monetary Value
      console.log('Step 5: Calculate Monetary Value');
      const monthlySalary = (worker.basicSalary || 0) + (worker.housing || 0) + (worker.workNature || 0) + (worker.transport || 0) + (worker.phone || 0) + (worker.food || 0);
      const dayRate = monthlySalary / 30;
      const monetaryValue = accruedDays * dayRate;

      console.log('Monetary value calculation:', { monthlySalary, dayRate, monetaryValue });

      // 6. Return detailed results
      console.log('Step 6: Prepare results');
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
      
      console.log('Leave balance calculation completed successfully:', result);
      resolve({ success: true, data: result });

    } catch (error) {
      console.error('Error calculating leave balance:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء حساب الرصيد.';
      resolve({ success: false, error: errorMessage });
    }
  });

  // Wrap the calculation in a timeout
  console.log('Setting timeout for calculation');
  return withTimeout(calculationPromise, 25000); // 25 second timeout
}