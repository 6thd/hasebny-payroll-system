import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * Check if Firebase connection is working
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function checkFirebaseConnection(): Promise<{success: boolean, error?: string}> {
  try {
    // Try to fetch a small amount of data to test the connection
    const testQuery = query(collection(db, "employees"), limit(1));
    await getDocs(testQuery);
    return { success: true };
  } catch (error: any) {
    console.error("Firebase connection test failed:", error);
    return { 
      success: false, 
      error: error.message || "Failed to connect to Firebase" 
    };
  }
}

/**
 * Check if the user has network connectivity
 * @returns {boolean}
 */
export function checkNetworkConnectivity(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online in server-side contexts
}