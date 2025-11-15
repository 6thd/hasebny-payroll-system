
"use server";

import { adminDb as firestore } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { LeaveSettlementCalculation, Worker } from "@/types";
import { calculateLeaveBalance } from "@/app/actions/leave-balance";

export async function calculateLeaveSettlement(workerDocumentId: string, settlementDate: string): Promise<{ settlement?: LeaveSettlementCalculation, error?: string }> {
  if (!workerDocumentId) {
    return { error: "Worker document ID is required." };
  }
  if (!settlementDate) {
    return { error: "Settlement date is required." };
  }

  try {
    const workerRef = firestore.collection("employees").doc(workerDocumentId);
    const workerSnap = await workerRef.get();

    if (!workerSnap.exists) { // Corrected from exists() to exists
      return { error: "Worker document not found." };
    }
    
    const workerData = workerSnap.data() as Worker;
    
    const balanceResult = await calculateLeaveBalance({ 
      worker: { ...workerData, id: workerSnap.id },
      settlementDate: settlementDate 
    });

    if (!balanceResult.success) {
      return { error: balanceResult.error };
    }

    const { data } = balanceResult;

    const settlement: LeaveSettlementCalculation = {
      workerId: workerDocumentId,
      calculationDate: new Date(settlementDate),
      totalAccruedDays: data.accruedDays,
      daysTaken: 0,
      remainingLeaveBalance: data.accruedDays,
      cashEquivalent: data.monetaryValue,
      details: data.calculationBasis,
    };

    return { settlement };

  } catch (error: any) {
    console.error("Error in calculateLeaveSettlement:", error);
    return { error: error.message || "An unknown error occurred during calculation." };
  }
}

export async function finalizeLeaveSettlement(settlement: LeaveSettlementCalculation): Promise<{ success: boolean, historyId?: string, error?: string }> {
    if (!settlement || !settlement.workerId || !settlement.calculationDate) {
        return { success: false, error: "Settlement data is incomplete." };
    }

    const { workerId, calculationDate, totalAccruedDays, cashEquivalent, details } = settlement;

    if (!details || !(details as any).policy) {
        return { success: false, error: "Settlement calculation basis or policy is missing." };
    }
    const calculationBasis = details as any; 

    try {
        const batch = firestore.batch();
        const historyRef = firestore.collection("employees").doc(workerId).collection("serviceHistory").doc();
        
        const calculationTimestamp = Timestamp.fromDate(new Date(calculationDate));

        const detailsToStore = {
            workerId: workerId,
            calculationDate: calculationTimestamp,
            accruedDays: totalAccruedDays,
            monetaryValue: cashEquivalent,
            calculationBasis: {
                serviceYears: calculationBasis.serviceYears,
                annualEntitlement: calculationBasis.annualEntitlement,
                periodStartDate: calculationBasis.periodStartDate,
                periodEndDate: calculationBasis.periodEndDate,
                daysCounted: calculationBasis.daysCounted,
                policy_accrualBasis: calculationBasis.policy.accrualBasis,
                policy_includeWeekendsInAccrual: calculationBasis.policy.includeWeekendsInAccrual,
                policy_excludeUnpaidLeaveFromAccrual: calculationBasis.policy.excludeUnpaidLeaveFromAccrual,
                policy_annualEntitlementBefore5Y: calculationBasis.policy.annualEntitlementBefore5Y,
                policy_annualEntitlementAfter5Y: calculationBasis.policy.annualEntitlementAfter5Y,
            },
        };

        batch.set(historyRef, { 
            type: "LEAVE_SETTLEMENT", 
            finalizedAt: calculationTimestamp, 
            details: detailsToStore
        });
        
        const workerRef = firestore.collection("employees").doc(workerId);
        batch.update(workerRef, { "leaveBalance.lastSettlementDate": calculationTimestamp });
        
        await batch.commit();
        
        return { success: true, historyId: historyRef.id };
    } catch (error: any) {
        console.error("Error in finalizeLeaveSettlement:", error);
        return { success: false, error: `Firestore batch commit failed: ${error.message}` };
    }
}
