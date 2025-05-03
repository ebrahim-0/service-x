"use server";

import admin, { ServiceAccount } from "firebase-admin";

// Define the service account with server-side environment variables
const serviceAccount: ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Handle newline characters
};

// Validate environment variables
function validateEnv() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

// Initialize Firebase Admin SDK
export async function getFirebaseAdmin(): Promise<admin.app.App> {
  try {
    // Validate environment variables
    validateEnv();

    // Initialize only if no apps exist
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    return admin.app(); // Return the default app instance
  } catch (error) {
    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Get Firestore instance
export async function getFirestore() {
  const admin = await getFirebaseAdmin();
  return admin.firestore();
}
