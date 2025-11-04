
'use server';

import { adminDb as firestore } from "@/lib/firebase/admin";
import { AppUser } from "@/types";

export async function getUserProfile(userId: string): Promise<{ profile?: AppUser, error?: string }> {
    try {
        const doc = await firestore.collection('users').doc(userId).get();
        if (!doc.exists) {
            return { error: 'User not found' };
        }
        return { profile: doc.data() as AppUser };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateUserProfile(userId: string, profileData: Partial<AppUser>): Promise<{ success: boolean, error?: string }> {
    try {
        await firestore.collection('users').doc(userId).update(profileData);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
