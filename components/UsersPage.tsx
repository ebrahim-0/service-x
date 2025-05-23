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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { withCallbacks } from "@/lib/withCallbacks";
import { blockUser, fetchUsers } from "@/lib/user-utils";
import { deleteUser } from "@/lib/auth-admin";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    !isNaN(initialPage) && initialPage > 0 ? initialPage : 1
  );
  const [itemsPerPage] = useState(10); // Adjustable number of users per page

  // Fetch users for the current page
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { users: usersList, total } = await fetchUsers(
          currentPage,
          itemsPerPage
        );
        setUsers(usersList);
        setTotalUsers(total);

        // Check if the current page is valid
        const totalPages = Math.ceil(total / itemsPerPage);
        if (currentPage > totalPages || currentPage < 1) {
          // Redirect to page 1 if the requested page is invalid
          setCurrentPage(1);
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.set("page", "1");
          router.replace(`?${newSearchParams.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Fetch users error:", error);
        toast.error(t("messages.error.fetchUsers"));
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [currentPage, itemsPerPage, router, searchParams]);

  // Delete user action
  const deleteUserForm = withCallbacks(deleteUser, {
    onSuccess() {
      toast.dismiss();
      toast.success(t("messages.success.deleteUser"));
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.userId));
      setTotalUsers((prev) => prev - 1);
      setDeleteDialog({ open: false, userId: null });
      // Reset to previous page if current page becomes empty
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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

    setBlockDialog({
      open: true,
      userId,
      action: blocked ? "unblock" : "block",
    });
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

  // Pagination logic
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Update URL with new page query parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("page", page.toString());
      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    }
  };

  return (
    <div className="">
      <div className="max-w-full sm:max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
            {t("users.title")}
          </h1>
          <div>
            {loading ? (
              <div className="flex h-screen justify-center items-center">
                <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin" />
              </div>
            ) : users.length === 0 && totalUsers === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                {t("users.noUsers")}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2 text-sm sm:text-base">
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("users.email")}:
                          </span>{" "}
                          <span className="text-gray-800">{user.email}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("users.name")}:
                          </span>{" "}
                          <span className="text-gray-800">
                            {user.displayName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("users.role")}:
                          </span>{" "}
                          <span className="text-gray-800">
                            {user.isAdmin ? t("users.admin") : t("users.user")}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("users.status")}:
                          </span>{" "}
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${
                              user.blocked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.blocked
                              ? t("users.blocked")
                              : t("users.active")}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`flex w-full sm:w-auto items-center gap-2 text-xs sm:text-sm ${
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
                              <Unlock className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            {user.blocked
                              ? t("users.unblock")
                              : t("users.block")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex w-full sm:w-auto items-center gap-2 text-xs sm:text-sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            {t("users.delete")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, userId: open ? deleteDialog.userId : null })
        }
      >
        <DialogContent className="w-11/12 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {t("users.confirmDeleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {t("users.confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialog({ open: false, userId: null })}
            >
              {t("users.cancel")}
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
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
        <DialogContent className="w-11/12 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {blockDialog.action === "block"
                ? t("users.confirmBlockTitle")
                : t("users.confirmUnblockTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {blockDialog.action === "block"
                ? t("users.confirmBlockDescription")
                : t("users.confirmUnblockDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Button
              variant="outline"
              size="sm"
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
              size="sm"
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
