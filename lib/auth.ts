import { User, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "./firebase/firebase.browser";

interface LoginResult {
  succeeded: boolean;
  user: User | null;
  error?: string;
}

// Admin-only login
export const loginAdmin = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Check if user is an admin
    const userDoc = await getDoc(doc(firestore, "users", user.uid));
    const userData = userDoc.data();
    console.log("🚀 ~ userData:", userData);

    if (!userData?.isAdmin) {
      // Sign out non-admin users
      await auth.signOut();
      return {
        succeeded: false,
        user: null,
        error: "Unauthorized: Only admin users can access this panel",
      };
    }

    return {
      succeeded: true,
      user,
    };
  } catch (error) {
    return {
      succeeded: false,
      user: null,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
};
