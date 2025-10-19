
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Checks for basic network connectivity.
 * @returns {boolean} True if the browser reports being online, false otherwise.
 */
export function checkNetworkConnectivity(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Attempts a simple read from Firestore to verify the connection.
 * This is a more robust check than just network connectivity.
 * @returns {Promise<{success: boolean, error?: string}>} An object indicating success or failure.
 */
export async function checkFirebaseConnection(): Promise<{success: boolean; error?: string}> {
  try {
    // Attempt to read a non-existent document. This is a very low-cost operation.
    // We use a document path that is unlikely to exist.
    const nonExistentDocRef = doc(db, "internal-connection-test", "health-check");
    await getDoc(nonExistentDocRef);
    return { success: true };
  } catch (error: any) {
    let errorMessage = "An unknown error occurred.";
    if (error.code === 'unavailable') {
        errorMessage = "The service is currently unavailable. This is likely a network connectivity issue.";
    } else {
        errorMessage = error.message || "Failed to connect to Firebase.";
    }
    console.error("Firebase Connection Error:", error);
    return { success: false, error: errorMessage };
  }
}
