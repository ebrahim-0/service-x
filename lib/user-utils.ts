import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";

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

export const fetchUsers = async (
  page: number,
  itemsPerPage: number
): Promise<{ users: User[]; total: number }> => {
  try {
    // Get total count of users
    const totalSnapshot = await getDocs(collection(firestore, "users"));
    const total = totalSnapshot.size;

    // Calculate the offset for pagination
    const offset = (page - 1) * itemsPerPage;

    // Query for paginated users
    let usersQuery = query(
      collection(firestore, "users"),
      orderBy("email"), // Order by email for consistent pagination
      limit(itemsPerPage)
    );

    // If not the first page, start after the last document of the previous page
    if (offset > 0) {
      const prevPageSnapshot = await getDocs(
        query(collection(firestore, "users"), orderBy("email"), limit(offset))
      );
      const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
      usersQuery = query(
        collection(firestore, "users"),
        orderBy("email"),
        startAfter(lastDoc),
        limit(itemsPerPage)
      );
    }

    const querySnapshot = await getDocs(usersQuery);
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().email || "",
      displayName: doc.data().displayName || "",
      isAdmin: doc.data().isAdmin || false,
      blocked: doc.data().blocked || false,
    })) as User[];

    return { users, total };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch users"
    );
  }
};

export const blockUser = async ({
  userId,
  block,
}: {
  userId: string | null;
  block: boolean;
}): Promise<ActionResult & { userId: string; blocked: boolean }> => {
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
        error: "Unauthorized: Cannot block super admin",
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
