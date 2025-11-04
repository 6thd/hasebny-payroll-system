
'use server';

import { adminDb as firestore } from "@/lib/firebase/admin";
import { Settlement } from "@/types";

async function getEmployeeDocRef(employeeId: string) {
    const employeesRef = firestore.collection('employees');
    const q = employeesRef.where('id', '==', employeeId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        throw new Error(`Employee with ID "${employeeId}" not found.`);
    }
    return querySnapshot.docs[0].ref;
}

export async function getSettlements(employeeId: string): Promise<{ settlements?: Settlement[], error?: string }> {
    try {
        const employeeDocRef = await getEmployeeDocRef(employeeId);
        // The .orderBy() clause was removed to prevent a missing-index error.
        const snapshot = await employeeDocRef.collection('serviceHistory').where('type', '==', 'EndOfService').get();
        
        if (snapshot.empty) {
            return { settlements: [] };
        }

        const settlements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Settlement[];
        
        // Sorting is now handled in the code to bypass the need for a composite index.
        settlements.sort((a, b) => {
            const dateA = a.finalizedAt ? (a.finalizedAt as any).toDate().getTime() : 0;
            const dateB = b.finalizedAt ? (b.finalizedAt as any).toDate().getTime() : 0;
            return dateB - dateA; // Sort descending
        });

        return { settlements };
    } catch (error: any) {
        console.error("Error fetching settlements:", error);
        return { error: `Failed to fetch settlement history: ${error.message}` };
    }
}

export async function createSettlement(employeeId: string, settlementData: Omit<Settlement, 'id'>): Promise<{ success: boolean, settlementId?: string, error?: string }> {
    try {
        const employeeDocRef = await getEmployeeDocRef(employeeId);
        const settlementRef = await employeeDocRef.collection('serviceHistory').add(settlementData);
        return { success: true, settlementId: settlementRef.id };
    } catch (error: any) {
        console.error("Error creating settlement:", error);
        return { success: false, error: `Failed to create new settlement: ${error.message}` };
    }
}
