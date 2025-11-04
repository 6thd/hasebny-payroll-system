
import { useState, useEffect } from 'react';
import { DocumentData } from '@/types';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export function useEmployeeDocuments(employeeId: string) {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const documentsRef = collection(db, `employees/${employeeId}/documents`);
    const q = query(documentsRef, orderBy('uploadDate', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as DocumentData);
        setDocuments(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching documents: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [employeeId]);

  return { documents, loading };
}
