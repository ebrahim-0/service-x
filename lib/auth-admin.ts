"use server";

import admin from "firebase-admin";
import { getFirebaseAdmin, getFirestore } from "./firebase/firebase.admin";
// Define interfaces
interface RegisterData {
  email: string;
  password: string;
  username: string;
}

interface RegisterResult {
  succeeded: boolean;
  user: admin.auth.UserRecord | null;
  error?: string;
}

// Create new admin user (only by existing admins)
export async function createAdminUser(
  adminUser: { uid: string; email: string | null }, // Simplified type for server-side
  { email, password, username }: RegisterData
): Promise<RegisterResult> {
  try {
    if (!adminUser?.uid) {
      return {
        succeeded: false,
        user: null,
        error: "Unauthorized: No authenticated admin user",
      };
    }

    // Initialize the Admin SDK and Firestore
    const adminInstance = await getFirebaseAdmin();
    const db = await getFirestore();

    // Verify that the creating user is an admin (using custom claims)
    // const currentUserRecord = await adminInstance.auth().getUser(adminUser.uid);
    const currentUserRecord = await db
      .collection("users")
      .doc(adminUser.uid)
      .get();

    if (!currentUserRecord?.get("isAdmin")) {
      return {
        succeeded: false,
        user: null,
        error: "Unauthorized: Only admins can create new admin users",
      };
    }

    // Create the new user with Firebase Authentication
    const userRecord = await adminInstance.auth().createUser({
      email,
      password, // Plain-text password (Firebase handles hashing)
      displayName: username,
    });

    // Set custom claim for admin status
    await adminInstance
      .auth()
      .setCustomUserClaims(userRecord.uid, { isAdmin: true });

    // Store additional user data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      isAdmin: true,
      createdAt: new Date().toISOString(),
      createdBy: adminUser.uid,
      username,
      email,
    });

    return {
      succeeded: true,
      user: userRecord.toJSON() as admin.auth.UserRecord,
    };
  } catch (error) {
    return {
      succeeded: false,
      user: null,
      error: error instanceof Error ? error.message : "Admin creation failed",
    };
  }
}
