"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSelector } from "zustore";
import { useTranslations } from "next-intl";
import { Loader, Trash2, Lock, Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { withCallbacks } from "@/lib/withCallbacks";
import { blockUser, fetchUsers } from "@/lib/user-utils";
import { deleteUser } from "@/lib/auth-admin";

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  blocked: boolean;
}

export default function UsersPage() {
  const user = useSelector("user");
  const t = useTranslations("trans");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string | null;
  }>({
    open: false,
    userId: null,
  });
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    userId: string | null;
    action: "block" | "unblock";
  }>({ open: false, userId: null, action: "block" });

  // Fetch users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersList = await fetchUsers();
        setUsers(usersList);
      } catch (error) {
        console.error("Fetch users error:", error);
        toast.error(t("messages.error.fetchUsers"));
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Delete user action
  const deleteUserForm = withCallbacks(deleteUser, {
    onSuccess() {
      toast.dismiss();
      toast.success(t("messages.success.deleteUser"));
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.userId));
      setDeleteDialog({ open: false, userId: null });
    },
    onError(result) {
      toast.dismiss();
      toast.error(result.error);
    },
  });

  const [deleteState, deleteUserAction] = useActionState(
    (_: unknown, payload: string) => deleteUserForm(payload),
    undefined
  );

  const handleDelete = (userId: string) => {
    if (userId === user?.uid) {
      toast.error(t("messages.error.deleteSelf"));
      return;
    }
    if (user?.isSuperAdmin) {
      setDeleteDialog({ open: true, userId });
    } else {
      toast.error(t("messages.error.notAllowed"));
    }
  };

  // Block/unblock user action
  const blockUserForm = withCallbacks(blockUser, {
    onSuccess({ userId, blocked }) {
      toast.dismiss();
      toast.success(
        blocked
          ? t("messages.success.blockUser")
          : t("messages.success.unblockUser")
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, blocked } : u))
      );
      setBlockDialog({ open: false, userId: null, action: "block" });
    },
    onError(result) {
      toast.dismiss();
      toast.error(result.error);
    },
  });

  const [blockState, blockUserAction] = useActionState(
    (_: unknown, payload: { userId: string | null; block: boolean }) =>
      blockUserForm(payload),
    undefined
  );

  const handleBlockToggle = (userId: string, blocked: boolean) => {
    if (userId === user?.uid) {
      toast.error(t("messages.error.blockSelf"));
      return;
    }
    if (user?.isSuperAdmin) {
      setBlockDialog({
        open: true,
        userId,
        action: blocked ? "unblock" : "block",
      });
    } else {
      toast.error(t("messages.error.notAllowed"));
    }
  };

  const confirmBlockToggle = () => {
    if (blockDialog.userId) {
      startTransition(() => {
        toast.loading(
          blockDialog.action === "block"
            ? t("messages.loading.blockUser")
            : t("messages.loading.unblockUser")
        );
        blockUserAction({
          userId: blockDialog.userId,
          block: blockDialog.action === "block",
        });
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.userId) {
      startTransition(() => {
        toast.loading(t("messages.loading.deleteUser"));
        deleteUserAction(deleteDialog.userId as any);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {t("users.title")}
          </h1>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("users.noUsers")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rtl:text-right ltr:text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">
                      {t("users.email")}
                    </th>
                    <th className="p-4 font-semibold text-gray-700">
                      {t("users.name")}
                    </th>
                    <th className="p-4 font-semibold text-gray-700">
                      {t("users.role")}
                    </th>
                    <th className="p-4 font-semibold text-gray-700">
                      {t("users.status")}
                    </th>
                    <th className="p-4 font-semibold text-gray-700">
                      {t("users.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition-colors`}
                    >
                      <td className="p-4 text-gray-800">{user.email}</td>
                      <td className="p-4 text-gray-800">
                        {user.displayName || "N/A"}
                      </td>
                      <td className="p-4 text-gray-800">
                        {user.isAdmin ? t("users.admin") : t("users.user")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.blocked
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.blocked
                            ? t("users.blocked")
                            : t("users.active")}
                        </span>
                      </td>
                      <td className="p-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex w-32 items-center gap-2 ${
                            user.blocked
                              ? "border-green-500 text-green-600 hover:bg-green-50"
                              : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                          }`}
                          onClick={() =>
                            handleBlockToggle(user.id, user.blocked)
                          }
                          disabled={isPending}
                        >
                          {user.blocked ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          {user.blocked ? t("users.unblock") : t("users.block")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleDelete(user.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t("users.delete")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, userId: open ? deleteDialog.userId : null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("users.confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, userId: null })}
            >
              {t("users.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("users.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Confirmation Dialog */}
      <Dialog
        open={blockDialog.open}
        onOpenChange={(open) =>
          setBlockDialog({
            open,
            userId: open ? blockDialog.userId : null,
            action: blockDialog.action,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockDialog.action === "block"
                ? t("users.confirmBlockTitle")
                : t("users.confirmUnblockTitle")}
            </DialogTitle>
            <DialogDescription>
              {blockDialog.action === "block"
                ? t("users.confirmBlockDescription")
                : t("users.confirmUnblockDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setBlockDialog({ open: false, userId: null, action: "block" })
              }
            >
              {t("users.cancel")}
            </Button>
            <Button
              variant={
                blockDialog.action === "block" ? "destructive" : "default"
              }
              onClick={confirmBlockToggle}
            >
              {blockDialog.action === "block"
                ? t("users.block")
                : t("users.unblock")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
