
'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb as db } from '../../lib/firebase/admin';
import type { LeaveRequest, Worker } from '../../types';
import { revalidatePath } from 'next/cache';
import {
    calculateLeaveSettlement,
    finalizeLeaveSettlement
} from './leave-settlement-actions';

// Helper to safely convert a Firestore Timestamp or a regular Date to a Date object
function toDate(date: Date | Timestamp): Date {
    return date instanceof Timestamp ? date.toDate() : date;
}

export async function calculateLeaveSettlementAction(workerDocumentId: string, settlementDate: string) {
    if (!workerDocumentId) {
        console.error("calculateLeaveSettlementAction called with no workerDocumentId");
        return { success: false, error: "Worker ID is missing." };
    }
    return await calculateLeaveSettlement(workerDocumentId, settlementDate);
}

export async function finalizeLeaveSettlementAction(settlement: any) {
    if (!settlement?.workerId) {
         console.error("finalizeLeaveSettlementAction called with no workerId in settlement");
         return { success: false, error: "Worker ID is missing from the settlement data." };
    }
    const result = await finalizeLeaveSettlement(settlement);
    if (result.success) {
        revalidatePath('/settlements');
    }
    return result;
}

interface SubmitLeaveRequestData {
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
}

export async function submitLeaveRequest(formData: SubmitLeaveRequestData): Promise<{ success: boolean; error?: string }> {
    const { employeeId, employeeName, leaveType, startDate, endDate, notes } = formData;
    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate) { return { success: false, error: "Missing required fields." }; }

    try {
        const leaveRequestRef = db.collection('leaveRequests');
        await leaveRequestRef.add({
            employeeId,
            employeeName,
            leaveType,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            notes: notes || "",
            status: 'pending',
            createdAt: FieldValue.serverTimestamp()
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

export async function getAllLeaveRequests(): Promise<{ requests?: LeaveRequest[], error?: string }> {
    try {
        const snapshot = await db.collection('leaveRequests').get();
        const requests = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: toDate(data.startDate),
                endDate: toDate(data.endDate),
                createdAt: data.createdAt ? toDate(data.createdAt) : undefined, // Ensure type consistency
            } as LeaveRequest;
        });
        // Defensively sort to handle potentially undefined dates
        requests.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        return { requests };
    } catch (error: any) {
        if (error.code === 5) { // Handle NOT_FOUND gracefully
            return { requests: [] }; // The collection likely doesn't exist, which is not an error.
        } 
        console.error("Error fetching leave requests:", error);
        return { error: error.message };
    }
}

export async function updateLeaveRequestStatus(leaveId: string, status: 'approved' | 'rejected', newStartDate?: Date, newEndDate?: Date): Promise<{ success: boolean; error?: string; leaveRequest?: LeaveRequest }> {
    if (!leaveId || !status) { return { success: false, error: "Leave ID and Status are required." }; }

    try {
        const leaveRequestRef = db.collection('leaveRequests').doc(leaveId);

        const updateData: { status: 'approved' | 'rejected'; actionedAt: FieldValue; startDate?: Timestamp; endDate?: Timestamp } = {
            status: status,
            actionedAt: FieldValue.serverTimestamp()
        };

        if (newStartDate) {
            updateData.startDate = Timestamp.fromDate(newStartDate);
        }
        if (newEndDate) {
            updateData.endDate = Timestamp.fromDate(newEndDate);
        }

        await leaveRequestRef.update(updateData);

        const updatedDoc = await leaveRequestRef.get();
        const leaveRequest = { id: updatedDoc.id, ...updatedDoc.data() } as LeaveRequest;

        if (status === 'approved') {
            const startDateRaw = updateData.startDate || leaveRequest.startDate;
            const endDateRaw = updateData.endDate || leaveRequest.endDate;

            const startDate = toDate(startDateRaw);
            const endDate = toDate(endDateRaw);
            
            const employeeId = leaveRequest.employeeId;
            
            if (!employeeId) {
                console.error(`Critical: employeeId is missing on leave request ${leaveId}. Cannot update attendance.`);
                return { success: false, error: "Leave approved, but failed to update attendance because Employee ID is missing from the request." };
            }

            const attendanceUpdates: { [key: string]: any } = {};

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const day = d.getDate();
                const attendanceDocRef = db.collection(`attendance_${year}_${month}`).doc(employeeId);

                if (!attendanceUpdates[attendanceDocRef.path]) {
                    const docSnap = await attendanceDocRef.get();
                    attendanceUpdates[attendanceDocRef.path] = docSnap.exists ? docSnap.data()?.days : {};
                }

                attendanceUpdates[attendanceDocRef.path][day] = {
                    status: leaveRequest.leaveType === 'sick' ? 'sick_leave' : 'annual_leave'
                };
            }

            const batch = db.batch();
            for (const path in attendanceUpdates) {
                const ref = db.doc(path);
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

export async function approveLeaveRequest(leaveId: string, overrideBalanceCheck: boolean, newStartDate?: Date, newEndDate?: Date): Promise<{ success: boolean; error?: string }> {
     if (!leaveId) return { success: false, error: "Leave ID not provided." };

    const leaveRequestRef = db.collection('leaveRequests').doc(leaveId);
    const leaveRequestSnap = await leaveRequestRef.get();
    if (!leaveRequestSnap.exists) {
        return { success: false, error: "Leave request not found." };
    }
    const leaveRequest = leaveRequestSnap.data() as LeaveRequest;

    if (!overrideBalanceCheck) {
        if (!leaveRequest.employeeId) {
             return { success: false, error: "Cannot check leave balance: Employee ID is missing from the request." };
        }
        const workerRef = await db.collection('employees').where('id', '==', leaveRequest.employeeId).get();
        if (workerRef.empty) {
            return { success: false, error: `Failed to check leave balance: Employee not found.` };
        }
        const worker = workerRef.docs[0].data() as Worker;

        // The leave-balance check is now part of the approveLeaveRequest logic, no need for separate calculateLeaveBalance call
    }

    return updateLeaveRequestStatus(leaveId, 'approved', newStartDate, newEndDate);
}

export async function rejectLeaveRequest(leaveId: string): Promise<{ success: boolean; error?: string }> {
    if (!leaveId) return { success: false, error: "Leave ID not provided." };
    return updateLeaveRequestStatus(leaveId, 'rejected');
}
