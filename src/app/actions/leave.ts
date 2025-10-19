'use server';

import { collection, collectionGroup, doc, getDoc, getDocs, query, where, writeBatch, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LeaveSettlementCalculation, LeavePolicy, Worker, LeaveRequest } from '@/types';
import { revalidatePath } from 'next/cache';

// =============================================================================
// SHARED CONFIGURATION
// =============================================================================

const defaultLeavePolicy: LeavePolicy = {
  accrualBasis: 'daily',
  includeWeekendsInAccrual: true, 
  excludeUnpaidLeaveFromAccrual: true,
  annualEntitlementBefore5Y: 21,
  annualEntitlementAfter5Y: 30,
};

// =============================================================================
// LEAVE SETTLEMENT FUNCTIONS
// =============================================================================

/**
 * Calculates the leave settlement for a given worker based on their service history and company policy.
 */
export async function calculateLeaveSettlement(workerId: string, lastApprovedLeaveDate?: string): Promise<LeaveSettlementCalculation | { error: string }> {
  try {
    const workerRef = doc(db, 'workers', workerId);
    const workerSnap = await getDoc(workerRef);
    if (!workerSnap.exists()) { return { error: 'Worker not found.' }; }

    const worker = workerSnap.data() as Worker;
    const policy = defaultLeavePolicy;
    const serviceYears = (new Date().getTime() - new Date(worker.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const annualEntitlement = serviceYears >= 5 ? policy.annualEntitlementAfter5Y : policy.annualEntitlementBefore5Y;
    const periodStartDate = lastApprovedLeaveDate ? new Date(lastApprovedLeaveDate) : new Date(worker.hireDate);
    const periodEndDate = new Date();
    const daysCounted = (periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24);
    const accruedDays = (daysCounted / 365.25) * annualEntitlement;
    const dailyRate = worker.salaryDetails.baseSalary / 30;
    const monetaryValue = accruedDays * dailyRate;

    return {
      workerId, workerName: worker.name, calculationDate: new Date().toISOString(), accruedDays, monetaryValue,
      calculationBasis: {
        serviceYears, annualEntitlement, periodStartDate: periodStartDate.toISOString().split('T')[0], 
        periodEndDate: periodEndDate.toISOString().split('T')[0], daysCounted, dailyRate, policy,
      },
    };
  } catch (error: any) {
    console.error('Error in calculateLeaveSettlement:', error);
    return { error: error.message || 'An unknown error occurred during calculation.' };
  }
}

/**
 * Finalizes a leave settlement, creating a permanent record in the worker's service history.
 */
export async function finalizeLeaveSettlement(settlement: LeaveSettlementCalculation): Promise<{ success: boolean, historyId?: string, error?: string }> {
    if (!settlement) { return { success: false, error: 'Settlement data is missing.' }; }
    try {
        const batch = writeBatch(db);
        const historyRef = doc(collection(db, 'workers', settlement.workerId, 'serviceHistory'));
        batch.set(historyRef, { type: 'LEAVE_SETTLEMENT', finalizedAt: new Date(), details: settlement });
        const workerRef = doc(db, 'workers', settlement.workerId);
        batch.update(workerRef, { 'leaveBalance.lastSettlementDate': new Date().toISOString() });
        await batch.commit();
        revalidatePath('/settlements');
        return { success: true, historyId: historyRef.id };
    } catch (error: any) {
        console.error('Error in finalizeLeaveSettlement:', error);
        return { success: false, error: error.message || 'An unknown error occurred during finalization.' };
    }
}

// =============================================================================
// LEAVE REQUEST & MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Submits a new leave request for a worker, which is created with a 'pending' status.
 */
export async function submitLeaveRequest(formData: { workerId: string; leaveType: string; startDate: string; endDate: string; reason: string; }): Promise<{ success: boolean; error?: string }> {
    const { workerId, leaveType, startDate, endDate, reason } = formData;
    if (!workerId || !leaveType || !startDate || !endDate) { return { success: false, error: "Missing required fields." }; }
    try {
        const leaveHistoryRef = collection(db, 'workers', workerId, 'leaveHistory');
        await addDoc(leaveHistoryRef, { type: leaveType, startDate, endDate, reason, status: 'pending', requestedAt: serverTimestamp() });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error("Error submitting leave request:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}

/**
 * Fetches all leave requests across all workers that are currently in 'pending' status.
 */
export async function getPendingLeaveRequests(): Promise<(LeaveRequest & { id: string; workerId: string; workerName: string })[]> {
    const pendingRequests: (LeaveRequest & { id: string; workerId: string; workerName: string })[] = [];
    try {
        const workersSnap = await getDocs(collection(db, 'workers'));
        for (const workerDoc of workersSnap.docs) {
            const worker = { id: workerDoc.id, ...workerDoc.data() } as Worker;
            const leaveHistoryQuery = query(collection(db, 'workers', worker.id, 'leaveHistory'), where('status', '==', 'pending'));
            const leaveHistorySnap = await getDocs(leaveHistoryQuery);
            leaveHistorySnap.forEach(leaveDoc => {
                const leaveData = leaveDoc.data();
                const requestedAt = leaveData.requestedAt?.toDate ? leaveData.requestedAt.toDate().toISOString() : new Date().toISOString();
                pendingRequests.push({ id: leaveDoc.id, workerId: worker.id, workerName: worker.name, ...(leaveData as LeaveRequest), requestedAt });
            });
        }
        return pendingRequests;
    } catch (error: any) {
        console.error("Error fetching pending leave requests:", error);
        return []; // Return empty array on error
    }
}

/**
 * A generic helper function to update the status of a leave request.
 */
async function updateLeaveRequestStatus(workerId: string, leaveId: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> {
    if (!workerId || !leaveId || !status) { return { success: false, error: "Worker ID, Leave ID, and Status are required." }; }
    try {
        const leaveRequestRef = doc(db, 'workers', workerId, 'leaveHistory', leaveId);
        await updateDoc(leaveRequestRef, { status: status, actionedAt: serverTimestamp() });
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating leave status to ${status}:`, error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}

/**
 * Approves a specific leave request.
 */
export async function approveLeaveRequest(workerId: string, leaveId: string): Promise<{ success: boolean; error?: string }> {
    return updateLeaveRequestStatus(workerId, leaveId, 'approved');
}

/**
 * Rejects a specific leave request.
 */
export async function rejectLeaveRequest(workerId: string, leaveId: string): Promise<{ success: boolean; error?: string }> {
    return updateLeaveRequestStatus(workerId, leaveId, 'rejected');
}
