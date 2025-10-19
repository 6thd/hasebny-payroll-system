
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getDocs, type Query, type DocumentData } from 'firebase/firestore';
import { useToast } from './use-toast';

interface UseFirestoreListenerOptions<T> {
  query: Query<DocumentData>;
  transform?: (doc: DocumentData) => T;
  onFetch?: (data: T[]) => T[];
  dependencies?: any[];
}

export function useFirestoreListener<T>({
  query,
  transform = (doc) => ({ id: doc.id, ...doc.data() } as T),
  onFetch,
  dependencies = [],
}: UseFirestoreListenerOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(query);
      let fetchedData = querySnapshot.docs.map(transform);

      if (onFetch) {
        fetchedData = onFetch(fetchedData);
      }
      
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching Firestore data:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "لم نتمكن من تحميل البيانات من قاعدة البيانات.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ...dependencies]);

  useEffect(() => {
    fetchData();

    // Listen for a custom event to refetch data
    const handleDataUpdate = () => fetchData();
    window.addEventListener('data-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
