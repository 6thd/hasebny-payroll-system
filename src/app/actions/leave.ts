'use server';

import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc, query, where, getDocs, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { calculateLeaveBalance } from './leave-balance';

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
    revalidatePath('/settlements');
    // Dispatch a custom event that client components can listen to
    // This is a pattern to trigger client-side refetches.
    // We will use a more direct approach if this doesn't work.

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

export async function approveLeaveRequest(requestId: string, overrideBalanceCheck: boolean = false, newStartDate?: Date, newEndDate?: Date) {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            return { success: false, error: 'لم يتم العثور على الطلب.' };
        }
        
        const leaveData = requestSnap.data();
        const { employeeId, leaveType } = leaveData;
        
        const start = newStartDate || leaveData.startDate.toDate();
        const end = newEndDate || leaveData.endDate.toDate();

        if (end < start) {
            return { success: false, error: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.' };
        }

        // --- Start of Leave Balance Check (REVISED LOGIC) ---
        if ((leaveType === 'annual' || leaveType === 'emergency') && !overrideBalanceCheck) {
            const balanceResult = await calculateLeaveBalance({ employeeId });
            
            if (!balanceResult.success) {
                return { success: false, error: balanceResult.error };
            }

            const availableBalance = balanceResult.data.accruedDays;
            const newLeaveDuration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

            if (newLeaveDuration > availableBalance) {
                 await updateDoc(requestRef, {
                    status: 'rejected',
                    reviewedAt: serverTimestamp(),
                    notes: `تم الرفض تلقائيًا لعدم وجود رصيد إجازات كافٍ. الرصيد المتاح: ${availableBalance.toFixed(2)} يوم.`
                });
                await createNotification(
                    employeeId,
                    `تم رفض طلب الإجازة الخاص بك لعدم كفاية الرصيد. الرصيد المتاح: ${availableBalance.toFixed(2)} يوم.`
                );
                revalidatePath('/');
                revalidatePath('/settlements');
                return { success: false, error: `رصيد الموظف غير كافٍ (${availableBalance.toFixed(2)} يوم). تم رفض الطلب تلقائيًا.` };
            }
        }
        // --- End of Leave Balance Check ---


        // Update attendance records
        const batch = writeBatch(db);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const attendanceDocRef = doc(db, `attendance_${year}_${month}`, employeeId);

            const fieldPath = `days.${day}`;
            batch.set(attendanceDocRef, {
                days: {
                    [day]: {
                        status: leaveType === 'sick' ? 'sick_leave' : leaveType === 'emergency' ? 'annual_leave' : 'annual_leave'
                    }
                }
            }, { merge: true });
        }

        // Update leave request status
        const finalUpdateData: any = {
            status: 'approved',
            reviewedAt: serverTimestamp(),
        };
        
        if (overrideBalanceCheck) {
            finalUpdateData.notes = 'تمت الموافقة مع تجاوز فحص الرصيد من قبل المدير.';
        }
        if (newStartDate) finalUpdateData.startDate = Timestamp.fromDate(newStartDate);
        if (newEndDate) finalUpdateData.endDate = Timestamp.fromDate(newEndDate);

        batch.update(requestRef, finalUpdateData);
        
        await batch.commit();
        
        await createNotification(
            employeeId, 
            'تمت الموافقة على طلب الإجازة الخاص بك.'
        );

        revalidatePath('/');
        revalidatePath('/settlements');
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
            'تم رفض طلب الإجازة الخاص بك من قبل الإدارة.'
        );

        revalidatePath('/');
        revalidatePath('/settlements');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        return { success: false, error: 'حدث خطأ أثناء رفض الطلب.' };
    }
}


// --- New Function to Settle Leave Balance ---
const SettleLeaveBalanceInputSchema = z.object({
    employeeId: z.string(),
    settlementDate: z.date(),
    results: z.any(), // a bit unsafe, but we trust our own data
});


export async function settleLeaveBalance(input: z.infer<typeof SettleLeaveBalanceInputSchema>) {
    const validation = SettleLeaveBalanceInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'بيانات غير صالحة.' };
    }
    
    const { employeeId, settlementDate, results } = validation.data;

    try {
        const batch = writeBatch(db);

        const employeeRef = doc(db, 'employees', employeeId);
        // 1. Update the employee's lastLeaveEndDate to reset the accrual period
        batch.update(employeeRef, {
            lastLeaveEndDate: Timestamp.fromDate(settlementDate),
        });

        // 2. Create a historical record of the settlement
        const historyRef = doc(collection(employeeRef, 'serviceHistory'));
        batch.set(historyRef, {
            type: 'LeaveSettlement',
            settlementDate,
            settledAt: serverTimestamp(),
            ...results,
        });

        await batch.commit();
        revalidatePath('/settlements');
        return { success: true };
    } catch (error) {
        console.error('Error settling leave balance:', error);
        return { success: false, error: 'حدث خطأ أثناء حفظ بيانات تصفية الإجازة.' };
    }
}
