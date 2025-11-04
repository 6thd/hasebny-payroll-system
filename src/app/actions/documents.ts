
'use server';

import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Uploads a document for a specific employee.
 */
export async function uploadDocument(employeeId: string, formData: FormData): Promise<{ success: boolean, error?: string }> {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'لم يتم العثور على ملف.' };
    if (!employeeId) return { success: false, error: 'معرف الموظف مطلوب.' };

    try {
        const bucket = adminStorage.bucket();
        const filePath = `employee_documents/${employeeId}/${Date.now()}-${file.name}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        await bucket.file(filePath).save(fileBuffer, { metadata: { contentType: file.type } });

        const docRef = adminDb.collection('employees').doc(employeeId).collection('documents').doc();
        await docRef.set({
            id: docRef.id,
            fileName: file.name,
            fileType: file.type,
            storagePath: filePath,
            uploadDate: FieldValue.serverTimestamp(),
            category: 'عام',
            status: 'صالح',
        });

        revalidatePath('/profile');
        revalidatePath(`/employees/${employeeId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}

/**
 * Generates a secure, temporary download URL for a file in Firebase Storage.
 */
export async function getDocumentDownloadUrl(storagePath: string): Promise<{ success: boolean, url?: string, error?: string }> {
    if (!storagePath) return { success: false, error: 'مسار الملف غير موجود.' };

    try {
        const bucket = adminStorage.bucket();
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (!exists) return { success: false, error: 'الملف المطلوب غير موجود.' };

        const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 });
        return { success: true, url };
    } catch (error: any) {
        console.error("Error generating download URL:", error);
        return { success: false, error: "حدث خطأ أثناء إنشاء رابط التحميل." };
    }
}

/**
 * Deletes a document from Firestore and the corresponding file from Storage.
 */
export async function deleteDocument(employeeId: string, docId: string, storagePath: string): Promise<{ success: boolean, error?: string }> {
    if (!employeeId || !docId || !storagePath) {
        return { success: false, error: "معرفات المستند أو الموظف غير كافية للحذف." };
    }

    try {
        // 1. Delete the file from Firebase Storage
        const file = adminStorage.bucket().file(storagePath);
        const [exists] = await file.exists();
        if (exists) {
             await file.delete();
        }

        // 2. Delete the document record from Firestore
        await adminDb.collection('employees').doc(employeeId).collection('documents').doc(docId).delete();

        // 3. Revalidate the path to update the list instantly
        revalidatePath('/profile');
        revalidatePath(`/employees/${employeeId}`);

        return { success: true };

    } catch (error: any) {
        console.error("Error deleting document:", error);
        return { success: false, error: "حدث خطأ أثناء حذف المستند." };
    }
}
