'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const leaveRequestSchema = z.object({
  employeeId: z.string(),
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

  const { employeeId, ...leaveData } = validation.data;

  try {
    await addDoc(collection(db, 'employees', employeeId, 'leaveRequests'), {
      ...leaveData,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
    });

    // We can revalidate paths if we had a page to show leave requests
    // revalidatePath('/dashboard'); 

    return { success: true };
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء إرسال الطلب.',
    };
  }
}
