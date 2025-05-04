"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Product } from "@/lib/schemas";
import ProductDetailDialog from "./ProductDetailDialog";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

interface ProductsTableProps {
  refreshKey?: number;
  onProductUpdated?: () => void;
  onProductDeleted?: () => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  refreshKey,
  onProductUpdated,
  onProductDeleted,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
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

  const t = useTranslations("trans");

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const productsCollection = collection(firestore, "products");
      const querySnapshot = await getDocs(productsCollection);
      const fetchedProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(fetchedProducts);
      if (selectedProduct && selectedProduct.id) {
        const updatedProduct = fetchedProducts.find(
          (p) => p.id === selectedProduct.id
        );
        if (updatedProduct) {
          setSelectedProduct(updatedProduct);
        }
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
    fetchProducts();
  }, [refreshKey]);

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
        toast.success("Product deleted successfully!");
        if (onProductDeleted) {
          onProductDeleted();
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
    fetchProducts();
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  const handleProductDeleted = () => {
    fetchProducts();
    if (onProductDeleted) {
      onProductDeleted();
    }
    handleDialogClose();
  };

  if (loading) {
    return <div>{t("loading")}</div>;
  }

  if (error) {
    return (
      <div>
        <p className="text-red-500 mb-4">{error}</p>
        {products.length > 0 && (
          <p className="text-orange-500 mb-4">{t("displayingSampleData")}</p>
        )}
        {products.length > 0 ? (
          <ProductsTableView
            products={products}
            onRowClick={handleRowClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        ) : (
          <p>{t("couldNotLoadProducts")}</p>
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

  if (products.length === 0) {
    return <div>{t("noProductsFound")}</div>;
  }

  return (
    <div>
      <ProductsTableView
        products={products}
        onRowClick={handleRowClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("productLabels.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("productLabels.confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
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
            <Button variant="destructive" onClick={confirmDelete}>
              {t("buttons.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ProductsTableViewProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (productId: string, productName: string) => void;
}

const ProductsTableView: React.FC<ProductsTableViewProps> = ({
  products,
  onRowClick,
  onEditClick,
  onDeleteClick,
}) => {
  const t = useTranslations("trans");

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("productLabels.code")}</TableHead>
            <TableHead>{t("productLabels.name")}</TableHead>
            <TableHead>{t("productLabels.price")}</TableHead>
            <TableHead>{t("productLabels.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow
              key={product.id || product.code}
              onClick={() => onRowClick(product)}
              className={`${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              } cursor-pointer hover:bg-muted/50 transition-colors`}
            >
              <TableCell>{product.code}</TableCell>
              <TableCell>{product.name || "N/A"}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      onEditClick(product);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    {t("buttons.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      if (product.id)
                        onDeleteClick(
                          product.id,
                          product.name || "Unnamed Product"
                        );
                    }}
                  >
                    <Trash2 className="w-4 h-4" />

                    {t("buttons.delete")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
