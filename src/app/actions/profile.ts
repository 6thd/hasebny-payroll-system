'use server';

import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

const ProfileUpdateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required.'),
  name: z.string().min(3, 'الاسم يجب أن يحتوي على 3 أحرف على الأقل.'),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export async function updateUserProfile(data: ProfileUpdateInput) {
  const validation = ProfileUpdateSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.flatten().fieldErrors,
    };
  }

  const { employeeId, ...updateData } = validation.data;

  try {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, updateData);
    
    // Revalidate the profile page and the main dashboard to reflect changes
    revalidatePath('/profile');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء تحديث البيانات.',
    };
  }
}
