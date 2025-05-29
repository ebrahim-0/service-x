"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase/firebase.browser";
import { useRouter } from "@/i18n/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "zustore";

interface UserData {
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
  createdBy: string;
  isSuperAdmin?: boolean;
  password?: string;
}

export function PrivateGuard() {
  const { replace } = useRouter();
  const { dispatch } = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If user is authenticated, redirect to dashboard
        replace("/login");
      } else {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        const docData = userDoc.data() as UserData | undefined;

        if (docData) {
          // Extract password if needed and omit from dispatch
          const { password, ...userData } = docData;
          void password; // Explicitly ignore the password
          console.log("🚀 ~ unsubscribe ~ userData:", userData);
          console.log("🚀 ~ unsubscribe ~ user:", user);

          dispatch({ user: { ...user, ...userData } });
        }
      }
    });

    return () => unsubscribe();
  }, [replace]);

  return <></>;
}
