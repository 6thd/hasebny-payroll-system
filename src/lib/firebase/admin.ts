import "server-only";
import admin from "firebase-admin";

// Debugging Step: Log environment variables to verify they are loaded on the server.
console.log("--- Verifying Firebase Admin Environment Variables ---");
console.log({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyLoaded: !!process.env.FIREBASE_PRIVATE_KEY,
  privateKeyType: typeof process.env.FIREBASE_PRIVATE_KEY,
});
console.log("----------------------------------------------------");


const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `The following environment variables are missing and are required for Firebase Admin initialization: ${missingEnvVars.join(', ')}. 
    Please check your .env.local file and restart the server.`
  );
}

// Construct the service account object from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
};

// Initialize the app if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: `${serviceAccount.projectId}.appspot.com`
  });
}

// Export the initialized services and the admin object itself
const adminAuth = admin.auth();
const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { admin, adminAuth, adminDb, adminStorage };
