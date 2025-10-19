import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function logAudit(action: string, resource: string, userId: string, details = {}) {
  await addDoc(collection(db, 'auditLogs'), {
    action,
    resource,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
}
