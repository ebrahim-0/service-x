import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";
import { getTranslations } from "next-intl/server";

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  blocked: boolean;
}

interface ActionResult {
  succeeded: boolean;
  error?: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(firestore, "users"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email || "",
    displayName: doc.data().displayName || "",
    isAdmin: doc.data().isAdmin || false,
    blocked: doc.data().blocked || false,
  })) as User[];
};

export const blockUser = async ({
  userId,
  block,
}: {
  userId: string | null;
  block: boolean;
}): Promise<ActionResult & { userId: string; blocked: boolean }> => {
  const t = await getTranslations("trans");

  if (!userId) {
    return {
      succeeded: false,
      userId: "",
      blocked: block,
      error: "User ID is null",
    };
  }

  try {
    const userRef = doc(firestore, "users", userId);

    const isSuperAdmin = await (await getDoc(userRef)).get("isSuperAdmin");

    if (isSuperAdmin) {
      return {
        succeeded: false,
        userId,
        blocked: block,
        error: t("messages.error.notAllowed"),
      };
    }

    await updateDoc(userRef, { blocked: block });
    return { succeeded: true, userId, blocked: block };
  } catch (error) {
    return {
      succeeded: false,
      userId,
      blocked: !block,
      error:
        error instanceof Error ? error.message : "Failed to update user status",
    };
  }
};
