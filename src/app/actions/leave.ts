'use server';

import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const leaveRequestSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(), // Added employeeName
  leaveType: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  notes: z.string().optional(),
});

type LeaveRequestData = z.infer<typeof leaveRequestSchema>;

export async function submitLeaveRequest(data: LeaveRequestData) {
  const validation = leaveRequestSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.flatten().fieldErrors,
    };
  }

  try {
    // Storing leave requests in a top-level collection for easier querying by admins
    await addDoc(collection(db, 'leaveRequests'), {
      ...validation.data,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
    });

    revalidatePath('/'); 

    return { success: true };
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء إرسال الطلب.',
    };
  }
}


export async function approveLeaveRequest(requestId: string) {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(requestRef, {
            status: 'approved',
            reviewedAt: serverTimestamp(),
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error approving leave request:', error);
        return { success: false, error: 'حدث خطأ أثناء الموافقة على الطلب.' };
    }
}

export async function rejectLeaveRequest(requestId: string) {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(requestRef, {
            status: 'rejected',
            reviewedAt: serverTimestamp(),
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        return { success: false, error: 'حدث خطأ أثناء رفض الطلب.' };
    }
}