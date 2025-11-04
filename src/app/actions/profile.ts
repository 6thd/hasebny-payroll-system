'use server';

import { z } from 'zod';
import { adminDb as db } from '@/lib/firebase/admin';
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

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const employeeRef = db.collection('employees').doc(employeeId);
      await employeeRef.update(updateData);
      
      // Revalidate the profile page and the main dashboard to reflect changes
      revalidatePath('/profile');
      revalidatePath('/');

      return { success: true };
    } catch (error) {
      console.error(`Error updating profile (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        return {
          success: false,
          error: 'حدث خطأ أثناء تحديث البيانات بعد عدة محاولات.',
        };
      }
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }

  return {
    success: false,
    error: 'حدث خطأ غير متوقع.',
  };
}
