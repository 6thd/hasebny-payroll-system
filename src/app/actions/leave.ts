'use server';

import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const leaveRequestSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
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
    await addDoc(collection(db, 'leaveRequests'), {
      ...validation.data,
      status: 'pending', 
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

async function createNotification(employeeId: string, message: string) {
  try {
    await addDoc(collection(db, 'notifications'), {
      employeeId,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // We don't want to fail the whole operation if notification fails
  }
}

export async function approveLeaveRequest(requestId: string) {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            return { success: false, error: 'لم يتم العثور على الطلب.' };
        }
        
        await updateDoc(requestRef, {
            status: 'approved',
            reviewedAt: serverTimestamp(),
        });
        
        await createNotification(
            requestSnap.data().employeeId, 
            'تمت الموافقة على طلب الإجازة الخاص بك.'
        );

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
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            return { success: false, error: 'لم يتم العثور على الطلب.' };
        }

        await updateDoc(requestRef, {
            status: 'rejected',
            reviewedAt: serverTimestamp(),
        });
        
        await createNotification(
            requestSnap.data().employeeId,
            'تم رفض طلب الإجازة الخاص بك.'
        );

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        return { success: false, error: 'حدث خطأ أثناء رفض الطلب.' };
    }
}
