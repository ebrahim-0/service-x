"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, X } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Order } from "@/hooks/useDashboardData";

export default function OrdersPage() {
  const t = useTranslations("trans");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialStatus = searchParams.get("status") || "all";
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(
    !isNaN(initialPage) && initialPage > 0 ? initialPage : 1
  );
  const [itemsPerPage] = useState(10); // Adjustable number of orders per page
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null); // Track updating order

  // Fetch orders for the current page

  const fetchOrders = async (page: number, itemsPerPage: number) => {
    setLoading(true);
    try {
      const baseRef = collection(firestore, "orders");

      let queries: any[] = [];

      // Filter by status if not 'all'
      if (statusFilter && statusFilter !== "all") {
        queries.push(where("status", "==", statusFilter));
      }

      // Always order by date descending
      queries.push(orderBy("date", "desc"));

      // Pagination: if offset > 0, use startAfter with last doc of previous page
      const offset = (page - 1) * itemsPerPage;

      if (offset > 0) {
        // Get documents up to the offset to determine the last doc
        const offsetSnapshot = await getDocs(
          query(baseRef, ...queries, limit(offset))
        );

        const docs = offsetSnapshot.docs;
        const lastDoc = docs[docs.length - 1];
        if (lastDoc) {
          queries.push(startAfter(lastDoc));
        }
      }

      // Apply limit for current page
      queries.push(limit(itemsPerPage));

      // Final composed query
      const finalQuery = query(baseRef, ...queries);

      // Fetch paginated orders
      const querySnapshot = await getDocs(finalQuery);
      const fetchedOrders: Order[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setOrders(fetchedOrders);

      // Get total count without pagination (but with status filter)
      const totalCountQuery = query(
        baseRef,
        ...(statusFilter && statusFilter !== "all"
          ? [where("status", "==", statusFilter)]
          : [])
      );
      const totalSnapshot = await getDocs(totalCountQuery);
      setTotalOrders(totalSnapshot.size);

      // Check if page is out of bounds and redirect
      const totalPages = Math.ceil(totalSnapshot.size / itemsPerPage);
      if (page > totalPages || page < 1) {
        setCurrentPage(1);
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("page", "1");
        router.replace(`?${newSearchParams.toString()}`, { scroll: false });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(t("orders.error.fetchOrders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, statusFilter]);

  // Update order status
  const updateOrderStatus = async (
    id: string,
    newStatus: "pending" | "approve" | "reject"
  ) => {
    setStatusUpdating(id);
    try {
      const orderRef = doc(firestore, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
      toast.success(t("orders.success.updateStatus"));
      // Refetch orders to ensure UI reflects latest data
      await fetchOrders(currentPage, itemsPerPage);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(error.message ? `: ${error.message}` : "");
    } finally {
      setStatusUpdating(null);
    }
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to page 1 on filter change
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      newSearchParams.set("status", value);
      newSearchParams.set("page", "1");
    } else {
      newSearchParams.delete("status");
      newSearchParams.delete("page");
    }
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // Clear status filter
  const clearStatusFilter = () => {
    setStatusFilter("all");
    setCurrentPage(1);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("status");
    newSearchParams.delete("page");
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("page", page.toString());
      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    }
  };

  // Open details dialog
  const openDetailsDialog = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  return (
    <div className="">
      <div className="max-w-full sm:max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
            {t("orders.title")}
          </h1>
          {/* Status Filter */}
          <div className="mb-4 flex items-center gap-2">
            <Select onValueChange={handleStatusChange} value={statusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("orders.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orders.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("orders.pending")}</SelectItem>
                <SelectItem value="approve">{t("orders.approve")}</SelectItem>
                <SelectItem value="reject">{t("orders.reject")}</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearStatusFilter}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t("orders.clear")}
              </Button>
            )}
          </div>
          <div>
            {loading ? (
              <div className="flex h-screen justify-center items-center">
                <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin" />
              </div>
            ) : orders.length === 0 && totalOrders === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                {statusFilter && statusFilter !== "all"
                  ? t("orders.noOrdersFound")
                  : t("orders.noOrders")}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={(e) => {
                        // Prevent dialog from opening when clicking the Select component
                        if (
                          !(e.target as HTMLElement).closest(".select-trigger")
                        ) {
                          openDetailsDialog(order);
                        }
                      }}
                    >
                      <div className="space-y-2 text-sm sm:text-base">
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("orders.orderId")}:
                          </span>{" "}
                          <span className="text-gray-800">
                            {order.orderId.slice(0, 15)}...
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("orders.date")}:
                          </span>{" "}
                          <span className="text-gray-800">
                            {new Date(order.date).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            {t("orders.status")}:
                          </span>{" "}
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateOrderStatus(
                                order.id,
                                value as "pending" | "approve" | "reject"
                              )
                            }
                            disabled={statusUpdating === order.id}
                          >
                            <SelectTrigger
                              dir="rtl"
                              disabled={statusUpdating === order.id}
                              className={cn(
                                "w-[120px] select-trigger font-medium rounded-full",
                                order.status === "pending"
                                  ? "bg-yellow-100 !text-yellow-800"
                                  : "",
                                order.status === "approve"
                                  ? "bg-green-100 !text-green-800"
                                  : "",
                                order.status === "reject"
                                  ? "bg-red-100 !text-red-800"
                                  : ""
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="pending">
                                {t("orders.pending")}
                              </SelectItem>
                              <SelectItem value="approve">
                                {t("orders.approve")}
                              </SelectItem>
                              <SelectItem value="reject">
                                {t("orders.reject")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("orders.totalPrice")}:
                          </span>{" "}
                          <span className="text-gray-800">
                            {order.totalPrice} {t("currencySymbol")}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t("orders.products")}:
                          </span>{" "}
                          <ul className="text-gray-800 list-disc list-inside">
                            {order.orderProducts.map((product, index) => (
                              <li key={index}>
                                {product.name} (x{product.quantity}) -{" "}
                                {product.price} {t("currencySymbol")}
                              </li>
                            ))}
                          </ul>
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

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="w-11/12 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {t("orders.detailsTitle")}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <span className="font-semibold text-gray-700">
                  {t("orders.orderId")}:
                </span>{" "}
                <span className="text-gray-800">{selectedOrder.orderId}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  {t("orders.date")}:
                </span>{" "}
                <span className="text-gray-800">
                  {new Date(selectedOrder.date).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">
                  {t("orders.status")}:
                </span>{" "}
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) =>
                    updateOrderStatus(
                      selectedOrder.id,
                      value as "pending" | "approve" | "reject"
                    )
                  }
                  disabled={statusUpdating === selectedOrder.id}
                >
                  <SelectTrigger
                    disabled={statusUpdating === selectedOrder.id}
                    className={cn(
                      "w-[120px] select-trigger text-xs font-medium rounded-full",
                      selectedOrder.status === "pending"
                        ? "bg-yellow-100 !text-yellow-800"
                        : "",
                      selectedOrder.status === "approve"
                        ? "bg-green-100 !text-green-800"
                        : "",
                      selectedOrder.status === "reject"
                        ? "bg-red-100 !text-red-800"
                        : ""
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="pending">
                      {t("orders.pending")}
                    </SelectItem>
                    <SelectItem value="approve">
                      {t("orders.approve")}
                    </SelectItem>
                    <SelectItem value="reject">{t("orders.reject")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  {t("orders.totalPrice")}:
                </span>{" "}
                <span className="text-gray-800">
                  {selectedOrder.totalPrice} {t("currencySymbol")}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  {t("orders.paymentMethod")}:
                </span>{" "}
                <span className="text-gray-800">
                  {selectedOrder.paymentMethod}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  {t("orders.shippingAddress")}:
                </span>{" "}
                <div className="text-gray-800 indent-7">
                  <p>
                    {t("orders.name")}:{" "}
                    {selectedOrder.shippingAddressModel.name}
                  </p>
                  <p>
                    {t("orders.address")}:{" "}
                    {selectedOrder.shippingAddressModel.address}
                  </p>
                  <p>
                    {t("orders.addressDetails")}:{" "}
                    {selectedOrder.shippingAddressModel.addressdetails}
                  </p>
                  <p>
                    {t("orders.city")}:{" "}
                    {selectedOrder.shippingAddressModel.city}
                  </p>
                  <p>
                    {t("orders.email")}:{" "}
                    {selectedOrder.shippingAddressModel.email}
                  </p>
                  <p>
                    {t("orders.phone")}:{" "}
                    {selectedOrder.shippingAddressModel.phone}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  {t("orders.products")}:
                </span>{" "}
                <ul className="text-gray-800 list-disc list-inside">
                  {selectedOrder.orderProducts.map((product, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span>
                        {product.name} (x{product.quantity}) - {product.price}{" "}
                        {t("currencySymbol")} (Code: {product.code})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
