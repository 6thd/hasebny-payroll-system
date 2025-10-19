'use server';

import { collection, doc, getDoc, query, where, writeBatch, addDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LeaveSettlementCalculation, LeavePolicy, Worker, LeaveRequest } from '@/types';
import { revalidatePath } from 'next/cache';
import { calculateLeaveBalance } from './leave-balance';

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
    const workerRef = doc(db, 'employees', workerId);
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
    const dailyRate = worker.basicSalary / 30;
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
        const historyRef = doc(collection(db, 'employees', settlement.workerId, 'serviceHistory'));
        batch.set(historyRef, { type: 'LEAVE_SETTLEMENT', finalizedAt: new Date(), details: settlement });
        const workerRef = doc(db, 'employees', settlement.workerId);
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

interface SubmitLeaveRequestData {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

/**
 * Submits a new leave request for a worker, which is created with a 'pending' status in a centralized collection.
 */
export async function submitLeaveRequest(formData: SubmitLeaveRequestData): Promise<{ success: boolean; error?: string }> {
    const { employeeId, employeeName, leaveType, startDate, endDate, notes } = formData;
    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate) { return { success: false, error: "Missing required fields." }; }
    
    try {
        const leaveRequestRef = collection(db, 'leaveRequests');
        await addDoc(leaveRequestRef, {
            employeeId,
            employeeName,
            leaveType,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            notes: notes || "",
            status: 'pending',
            createdAt: serverTimestamp()
        });
        revalidatePath('/dashboard');
        revalidatePath('/leaves');
        revalidatePath('/profile');
        return { success: true };
    } catch (error: any) {
        console.error("Error submitting leave request:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}

/**
 * A generic helper function to update the status of a leave request.
 */
async function updateLeaveRequestStatus(leaveId: string, status: 'approved' | 'rejected', newStartDate?: Date, newEndDate?: Date): Promise<{ success: boolean; error?: string; leaveRequest?: LeaveRequest }> {
    if (!leaveId || !status) { return { success: false, error: "Leave ID and Status are required." }; }
    
    try {
        const leaveRequestRef = doc(db, 'leaveRequests', leaveId);
        
        const updateData: { status: 'approved' | 'rejected'; actionedAt: Timestamp; startDate?: Timestamp; endDate?: Timestamp } = {
            status: status,
            actionedAt: serverTimestamp()
        };

        if (newStartDate) {
            updateData.startDate = Timestamp.fromDate(newStartDate);
        }
        if (newEndDate) {
            updateData.endDate = Timestamp.fromDate(newEndDate);
        }
        
        await updateDoc(leaveRequestRef, updateData);

        const updatedDoc = await getDoc(leaveRequestRef);
        const leaveRequest = { id: updatedDoc.id, ...updatedDoc.data() } as LeaveRequest;

        // If approved, update the attendance table
        if (status === 'approved') {
            const startDate = (updateData.startDate || leaveRequest.startDate).toDate();
            const endDate = (updateData.endDate || leaveRequest.endDate).toDate();
            const employeeId = leaveRequest.employeeId;

            // This logic is complex because it can span across months.
            // For now, we'll focus on the current month as an example.
            // A robust solution would use a Cloud Function to handle this transactionally.
            
            const attendanceUpdates: { [key: string]: any } = {};
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const day = d.getDate();
                const attendanceDocRef = doc(db, `attendance_${year}_${month}`, employeeId);

                if (!attendanceUpdates[attendanceDocRef.path]) {
                    const docSnap = await getDoc(attendanceDocRef);
                    attendanceUpdates[attendanceDocRef.path] = docSnap.exists() ? docSnap.data().days : {};
                }

                attendanceUpdates[attendanceDocRef.path][day] = {
                    status: leaveRequest.leaveType === 'sick' ? 'sick_leave' : 'annual_leave'
                };
            }

            const batch = writeBatch(db);
            for(const path in attendanceUpdates) {
                const ref = doc(db, path);
                batch.set(ref, { days: attendanceUpdates[path] }, { merge: true });
            }
            await batch.commit();
        }

        revalidatePath('/dashboard');
        revalidatePath('/leaves');
        
        return { success: true, leaveRequest };
    } catch (error: any) {
        console.error(`Error updating leave status to ${status}:`, error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}

/**
 * Approves a specific leave request.
 * Optionally allows overriding balance checks and modifying dates.
 */
export async function approveLeaveRequest(leaveId: string, overrideBalanceCheck: boolean, newStartDate?: Date, newEndDate?: Date): Promise<{ success: boolean; error?: string }> {
    const leaveRequestRef = doc(db, 'leaveRequests', leaveId);
    const leaveRequestSnap = await getDoc(leaveRequestRef);
    if (!leaveRequestSnap.exists()) {
        return { success: false, error: "Leave request not found." };
    }
    const leaveRequest = leaveRequestSnap.data() as LeaveRequest;

    if (!overrideBalanceCheck) {
        const balanceResult = await calculateLeaveBalance({ employeeId: leaveRequest.employeeId });
        if (balanceResult.success) {
            const requestedDays = ( (newEndDate || leaveRequest.endDate.toDate()).getTime() - (newStartDate || leaveRequest.startDate.toDate()).getTime() ) / (1000 * 3600 * 24) + 1;
            if (balanceResult.data.accruedDays < requestedDays) {
                return { success: false, error: `رصيد الإجازات غير كافٍ. الرصيد المتاح: ${balanceResult.data.accruedDays.toFixed(2)} يوم.` };
            }
        } else {
            // If balance check fails, return error but allow admin to override
            return { success: false, error: `فشل التحقق من رصيد الإجازات: ${balanceResult.error}` };
        }
    }

    return updateLeaveRequestStatus(leaveId, 'approved', newStartDate, newEndDate);
}

/**
 * Rejects a specific leave request.
 */
export async function rejectLeaveRequest(leaveId: string): Promise<{ success:boolean; error?: string }> {
    return updateLeaveRequestStatus(leaveId, 'rejected');
}
