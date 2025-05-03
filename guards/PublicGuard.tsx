"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase.browser";
import { useRouter } from "@/i18n/navigation";

export function PublicGuard() {
  const { replace } = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is authenticated, redirect to dashboard
        replace("/");
      }
    });

    return () => unsubscribe();
  }, [replace]);

  return <></>;
}
