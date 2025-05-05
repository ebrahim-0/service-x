"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Product } from "@/lib/schemas";
import ProductDetailDialog from "./ProductDetailDialog";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash2, Loader } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductsListProps {
  refreshKey?: number;
  onProductUpdated?: () => void;
  onProductDeleted?: () => void;
}

const ProductsList: React.FC<ProductsListProps> = ({
  refreshKey,
  onProductUpdated,
  onProductDeleted,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    productId: string | null;
    productName: string | null;
  }>({ open: false, productId: null, productName: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(
    !isNaN(initialPage) && initialPage > 0 ? initialPage : 1
  );
  const [itemsPerPage] = useState(10); // Adjustable number of products per page

  const t = useTranslations("trans");

  const fetchProducts = async (page: number, itemsPerPage: number) => {
    setLoading(true);
    setError(null);
    try {
      // Get total count of products
      const totalSnapshot = await getDocs(collection(firestore, "products"));
      const total = totalSnapshot.size;

      // Calculate the offset for pagination
      const offset = (page - 1) * itemsPerPage;

      // Query for paginated products
      let productsQuery = query(
        collection(firestore, "products"),
        orderBy("code"),
        limit(itemsPerPage)
      );

      // If not the first page, start after the last document of the previous page
      if (offset > 0) {
        const prevPageSnapshot = await getDocs(
          query(
            collection(firestore, "products"),
            orderBy("code"),
            limit(offset)
          )
        );
        const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        productsQuery = query(
          collection(firestore, "products"),
          orderBy("code"),
          startAfter(lastDoc),
          limit(itemsPerPage)
        );
      }

      const querySnapshot = await getDocs(productsQuery);
      const fetchedProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });

      setProducts(fetchedProducts);
      setTotalProducts(total);

      if (selectedProduct && selectedProduct.id) {
        const updatedProduct = fetchedProducts.find(
          (p) => p.id === selectedProduct.id
        );
        if (updatedProduct) {
          setSelectedProduct(updatedProduct);
        }
      }

      // Check if the current page is valid
      const totalPages = Math.ceil(total / itemsPerPage);
      if (page > totalPages || page < 1) {
        // Redirect to page 1 if the requested page is invalid
        setCurrentPage(1);
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("page", "1");
        router.replace(`?${newSearchParams.toString()}`, { scroll: false });
      }
    } catch (err) {
      console.error("Error fetching products: ", err);
      setError(
        "Failed to load special offer products. Please ensure Firebase is configured correctly."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, refreshKey]);

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditMode(false); // Open in view mode
    setIsDetailDialogOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditMode(true); // Open in edit mode
    setIsDetailDialogOpen(true);
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setDeleteDialog({ open: true, productId, productName });
  };

  const confirmDelete = async () => {
    if (deleteDialog.productId) {
      try {
        await deleteDoc(doc(firestore, "products", deleteDialog.productId));
        setProducts((prev) =>
          prev.filter((p) => p.id !== deleteDialog.productId)
        );
        setTotalProducts((prev) => prev - 1);
        toast.success("Product deleted successfully!");
        if (onProductDeleted) {
          onProductDeleted();
        }
        // Navigate to previous page if current page becomes empty
        if (products.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error("Error deleting product: ", error);
        toast.error("Failed to delete product.");
      } finally {
        setDeleteDialog({ open: false, productId: null, productName: null });
      }
    }
  };

  const handleDialogClose = () => {
    setIsDetailDialogOpen(false);
    setSelectedProduct(null);
    setIsEditMode(false);
  };

  const handleProductUpdated = () => {
    fetchProducts(currentPage, itemsPerPage);
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  const handleProductDeleted = () => {
    fetchProducts(currentPage, itemsPerPage);
    if (onProductDeleted) {
      onProductDeleted();
    }
    handleDialogClose();
  };

  // Pagination logic
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Update URL with new page query parameter
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("page", page.toString());
      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full sm:max-w-5xl mx-auto">
        <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
        {products.length > 0 && (
          <p className="text-orange-500 mb-4 text-sm sm:text-base">
            {t("displayingSampleData")}
          </p>
        )}
        {products.length > 0 ? (
          <>
            <ProductsListView
              products={products}
              onRowClick={handleRowClick}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
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
        ) : (
          <p className="text-gray-500 text-sm sm:text-base">
            {t("couldNotLoadProducts")}
          </p>
        )}
        {selectedProduct && (
          <ProductDetailDialog
            product={selectedProduct}
            isOpen={isDetailDialogOpen}
            isEditMode={isEditMode}
            onClose={handleDialogClose}
            onProductUpdated={handleProductUpdated}
            onProductDeleted={handleProductDeleted}
          />
        )}
      </div>
    );
  }

  if (products.length === 0 && totalProducts === 0) {
    return (
      <div className="container px-4 py-6 sm:py-8 mx-auto">
        <div className="max-w-full sm:max-w-5xl mx-auto">
          <p className="text-gray-500 text-sm sm:text-base">
            {t("noProductsFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <ProductsListView
        products={products}
        onRowClick={handleRowClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
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
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          isOpen={isDetailDialogOpen}
          isEditMode={isEditMode}
          onClose={handleDialogClose}
          onProductUpdated={handleProductUpdated}
          onProductDeleted={handleProductDeleted}
        />
      )}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({
            open,
            productId: open ? deleteDialog.productId : null,
            productName: open ? deleteDialog.productName : null,
          })
        }
      >
        <DialogContent className="w-11/12 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {t("productLabels.confirmDeleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {t("productLabels.confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDeleteDialog({
                  open: false,
                  productId: null,
                  productName: null,
                })
              }
            >
              {t("buttons.cancel")}
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              {t("buttons.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ProductsListView component remains unchanged
interface ProductsListViewProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (productId: string, productName: string) => void;
}

const ProductsListView: React.FC<ProductsListViewProps> = ({
  products,
  onRowClick,
  onEditClick,
  onDeleteClick,
}) => {
  const t = useTranslations("trans");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id || product.code}
          className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onRowClick(product)}
        >
          <div className="space-y-2 text-sm sm:text-base">
            <div className="w-full h-40 sm:h-48 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name || "Product"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-gray-500 text-xs sm:text-sm`}
                >
                  No Image Available
                </div>
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-700">
                {t("productLabels.code")}:
              </span>{" "}
              <span className="text-gray-800">{product.code}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">
                {t("productLabels.name")}:
              </span>{" "}
              <span className="text-gray-800">{product.name || "N/A"}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">
                {t("productLabels.price")}:
              </span>{" "}
              <span className="text-gray-800">
                {product.price.toFixed(2)} {t("currencySymbol")}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex w-full sm:w-auto items-center gap-2 text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onEditClick(product);
                }}
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("buttons.edit")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex w-full sm:w-auto items-center gap-2 text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  if (product.id)
                    onDeleteClick(
                      product.id,
                      product.name || "Unnamed Product"
                    );
                }}
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("buttons.delete")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsList;
