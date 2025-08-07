'use server';

import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getFirestore,
  writeBatch,
} from 'firebase/firestore';

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

const ANNUAL_LEAVE_BALANCE = 30;

export async function approveLeaveRequest(requestId: string, newStartDate?: Date, newEndDate?: Date) {
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

        // --- Start of Leave Balance Check ---
        if (leaveType === 'annual') {
            const employeeRef = doc(db, 'employees', employeeId);
            const employeeSnap = await getDoc(employeeRef);
            if (!employeeSnap.exists()) {
                return { success: false, error: 'لم يتم العثور على بيانات الموظف.' };
            }
            const employeeData = employeeSnap.data();
            const hireDate = employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(); // Fallback to current date if hireDate is missing
            const currentDate = new Date();
            
            let serviceYearStart = new Date(currentDate.getFullYear(), hireDate.getMonth(), hireDate.getDate());
            if (currentDate < serviceYearStart) {
                serviceYearStart.setFullYear(serviceYearStart.getFullYear() - 1);
            }
            const serviceYearEnd = new Date(serviceYearStart.getFullYear() + 1, serviceYearStart.getMonth(), serviceYearStart.getDate());

            const q = query(
                collection(db, 'leaveRequests'),
                where('employeeId', '==', employeeId),
                where('status', '==', 'approved'),
                where('leaveType', '==', 'annual'),
                where('startDate', '>=', Timestamp.fromDate(serviceYearStart)),
                where('startDate', '<', Timestamp.fromDate(serviceYearEnd))
            );

            const approvedLeavesSnap = await getDocs(q);
            let daysTaken = 0;
            approvedLeavesSnap.forEach(doc => {
                const req = doc.data();
                const reqStart = req.startDate.toDate();
                const reqEnd = req.endDate.toDate();
                daysTaken += (reqEnd.getTime() - reqStart.getTime()) / (1000 * 3600 * 24) + 1;
            });

            const newLeaveDuration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

            if (daysTaken + newLeaveDuration > ANNUAL_LEAVE_BALANCE) {
                 await updateDoc(requestRef, {
                    status: 'rejected',
                    reviewedAt: serverTimestamp(),
                    notes: 'تم الرفض تلقائيًا لعدم وجود رصيد إجازات كافٍ.'
                });
                await createNotification(
                    employeeId,
                    'تم رفض طلب الإجازة الخاص بك لعدم كفاية الرصيد.'
                );
                revalidatePath('/');
                return { success: false, error: 'رصيد الموظف غير كافٍ. تم رفض الطلب تلقائيًا.' };
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

            // Using set with merge to create or update the attendance document
            const fieldPath = `days.${day}`;
            batch.set(attendanceDocRef, {
                days: {
                    [day]: {
                        status: leaveType === 'sick' ? 'sick_leave' : 'annual_leave'
                    }
                }
            }, { merge: true });
        }

        // Update leave request status
        const finalUpdateData: any = {
            status: 'approved',
            reviewedAt: serverTimestamp(),
        };

        if (newStartDate) finalUpdateData.startDate = Timestamp.fromDate(newStartDate);
        if (newEndDate) finalUpdateData.endDate = Timestamp.fromDate(newEndDate);

        batch.update(requestRef, finalUpdateData);
        
        await batch.commit();
        
        await createNotification(
            employeeId, 
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
            'تم رفض طلب الإجازة الخاص بك من قبل الإدارة.'
        );

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        return { success: false, error: 'حدث خطأ أثناء رفض الطلب.' };
    }
}
