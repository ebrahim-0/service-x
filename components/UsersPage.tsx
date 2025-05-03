"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSelector } from "zustore";
import { useTranslations } from "next-intl";
import { firestore } from "@/lib/firebase/firebase.browser";
import { withCallbacks } from "@/lib/withCallbacks";
import { deleteUser } from "@/lib/auth-admin";
import { Loader } from "lucide-react";

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export default function UsersPage() {
  const user = useSelector("user");

  const [users, setUsers] = useState<User[]>([]);
  console.log("🚀 ~ UsersPage ~ users:", users);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("trans");

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersList);
    } catch (error: unknown) {
      console.log("🚀 ~ fetchUsers ~ error:", error);
      toast.error(t("messages.error.fetchUsers"));
    } finally {
      setLoading(false);
    }
  };

  const deleteUserForm = withCallbacks(deleteUser, {
    onSuccess() {
      toast.dismiss();
      toast.success(t("messages.success.deleteUser"));
    },
    onError(result) {
      toast.dismiss();

      toast.error(result.error);
    },
  });

  // @ts-ignore
  const [state, deleteUserAction] = useActionState(
    (_: unknown, payload: any) => deleteUserForm(payload),
    undefined
  );

  const [isPending, startTransition] = useTransition();

  const handleDelete = async (userId: string) => {
    if (userId === user?.uid) {
      toast.error(t("messages.error.deleteSelf"));
      return;
    }
    if (user?.isSuperAdmin) {
      startTransition(() => {
        toast.loading(t("messages.loading.deleteUser"));
        // @ts-ignore
        deleteUserAction(userId);
      });
    } else {
      toast.error(t("messages.error.notAllowed"));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [state]);

  if (loading) {
    return (
      <div className="flex h-full justify-center items-center">
        <Loader className="size-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">{t("users.title")}</h1>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 rtl:text-right ltr:text-left">
                  {t("users.email")}
                </th>
                <th className="p-4 rtl:text-right ltr:text-left">
                  {t("users.name")}
                </th>
                <th className="p-4 rtl:text-right ltr:text-left">
                  {t("users.role")}
                </th>
                <th className="p-4 rtl:text-right ltr:text-left">
                  {t("users.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.displayName}</td>
                  <td className="p-4">{user.isAdmin ? "admin" : "user"}</td>
                  <td className="p-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleDelete(user.id)}
                    >
                      {t("users.delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
