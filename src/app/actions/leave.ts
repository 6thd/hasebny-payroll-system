
'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb as db } from '../../lib/firebase/admin';
import type { LeaveRequest, Worker } from '../../types';
import { revalidatePath } from 'next/cache';
import {
    calculateLeaveSettlement,
    finalizeLeaveSettlement
} from './leave-settlement-actions';

// --- NEW HELPER FUNCTION ---
/**
 * Recursively converts Firestore Timestamps and Date objects to ISO strings.
 * This makes the data safe to pass from Server Components to Client Components.
 * @param data The data to serialize.
 * @returns The serialized data.
 */
function toPlainObject(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    if (data instanceof Timestamp) return data.toDate().toISOString();
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) return data.map(toPlainObject);

    // For generic objects, recurse
    const plain: {[key: string]: any} = {};
    for (const key of Object.keys(data)) {
        plain[key] = toPlainObject(data[key]);
    }
    return plain;
}

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

export async function getAllLeaveRequests(): Promise<{ requests?: any[], error?: string }> {
    try {
        const snapshot = await db.collection('leaveRequests').get();
        let requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort requests by creation date (which is a Timestamp) before serializing
        requests.sort((a: any, b: any) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });

        // Serialize the data to make it safe to pass to client components
        const serializedRequests = requests.map(toPlainObject);
        
        return { requests: serializedRequests };
    } catch (error: any) {
        if (error.code === 5) { // Handle NOT_FOUND gracefully
            return { requests: [] }; // The collection likely doesn't exist, which is not an error.
        } 
        console.error("Error fetching leave requests:", error);
        return { error: `Error fetching leave requests: ${error.message}` };
    }
}

async function updateLeaveRequestStatus(leaveId: string, status: 'approved' | 'rejected', newStartDate?: Date, newEndDate?: Date): Promise<{ success: boolean; error?: string; leaveRequest?: any }> {
    if (!leaveId || !status) { return { success: false, error: "Leave ID and Status are required." }; }

    const leaveRequestRef = db.collection('leaveRequests').doc(leaveId);

    try {
        const updateData: { status: 'approved' | 'rejected'; actionedAt: FieldValue; startDate?: Timestamp; endDate?: Timestamp } = {
            status: status,
            actionedAt: FieldValue.serverTimestamp()
        };

        if (newStartDate) updateData.startDate = Timestamp.fromDate(newStartDate);
        if (newEndDate) updateData.endDate = Timestamp.fromDate(newEndDate);

        await leaveRequestRef.update(updateData);

        const updatedDoc = await leaveRequestRef.get();
        const leaveRequest = { id: updatedDoc.id, ...updatedDoc.data() } as LeaveRequest;

        if (status === 'approved') {
            const startDate = toDate(newStartDate || leaveRequest.startDate);
            const endDate = toDate(newEndDate || leaveRequest.endDate);
            const employeeId = leaveRequest.employeeId;

            if (!employeeId) {
                throw new Error(`Critical: employeeId is missing on leave request ${leaveId}.`);
            }

            const batch = db.batch();
            const attendanceUpdatesByDoc: { [key: string]: { [key: string]: any } } = {};

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const loopDate = new Date(d);
                const year = loopDate.getFullYear();
                const month = loopDate.getMonth() + 1;
                const day = loopDate.getDate();
                const attendanceDocId = `attendance_${year}_${month}`;
                const docPath = `${attendanceDocId}/${employeeId}`;

                if (!attendanceUpdatesByDoc[docPath]) {
                    attendanceUpdatesByDoc[docPath] = {};
                }
                attendanceUpdatesByDoc[docPath][`days.${day}`] = {
                    status: leaveRequest.leaveType === 'sick' ? 'sick_leave' : 'annual_leave',
                    notes: `Auto-updated from leave request ${leaveId}`
                };
            }

            for (const path in attendanceUpdatesByDoc) {
                const ref = db.collection(path.split('/')[0]).doc(path.split('/')[1]);
                batch.update(ref, attendanceUpdatesByDoc[path]);
            }
            await batch.commit();
        }

        revalidatePath('/dashboard');
        revalidatePath('/leaves');
        return { success: true, leaveRequest: toPlainObject(leaveRequest) };

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
