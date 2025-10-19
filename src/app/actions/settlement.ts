
'use server';

import { collection, collectionGroup, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Worker, ServiceHistory } from '@/types';

/**
 * Fetches workers who are eligible for leave settlement.
 * This function now correctly preserves the Firestore document ID.
 */
export async function getEligibleWorkersForLeaveSettlement(): Promise<(Worker & { lastApprovedLeaveDate?: string })[]> {
    const workersCol = collection(db, 'employees');
    const workersSnap = await getDocs(workersCol);
    
    // The key fix: We map over the documents, spread the data, and THEN explicitly set the 'id'
    // to be the Firestore document's ID. This prevents any 'id' field within the document data
    // (like an employee number) from overwriting the true database ID.
    const workersData = workersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Worker);

    const eligibleWorkers = [];

    for (const worker of workersData) {
        const leaveHistoryQuery = query(
            collection(db, 'employees', worker.id, 'leaveHistory'),
            orderBy('endDate', 'desc')
        );
        const leaveHistorySnap = await getDocs(leaveHistoryQuery);

        if (!leaveHistorySnap.empty) {
            const lastLeave = leaveHistorySnap.docs[0].data();
            eligibleWorkers.push({
                ...worker, // The worker object now has the correct Firestore ID
                lastApprovedLeaveDate: lastLeave.endDate,
            });
        }
    }

    return eligibleWorkers;
}

/**
 * Fetches the finalized settlement history from all workers.
 */
export async function getSettlementHistory(): Promise<ServiceHistory[]> {
    const historyQuery = query(
        collectionGroup(db, 'serviceHistory'),
        orderBy('finalizedAt', 'desc')
    );
    
    const historySnap = await getDocs(historyQuery);

    const historyData = historySnap.docs.map(doc => {
        const data = doc.data();
        // The same fix is applied here to ensure data integrity.
        return {
            ...data,
            id: doc.id, // Preserve the Firestore document ID
            finalizedAt: data.finalizedAt.toDate().toISOString(),
            details: {
                ...data.details,
                calculationDate: data.details.calculationDate.toDate ? data.details.calculationDate.toDate().toISOString() : data.details.calculationDate,
            }
        } as ServiceHistory;
    });

    return historyData;
}
