// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Product } from "@/lib/schemas";
// import ProductDetailDialog from "./ProductDetailDialog";
// import { collection, getDocs } from "firebase/firestore";
// import { firestore } from "@/lib/firebase/firebase.browser";
// import { useTranslations } from "next-intl";

// // Accept key prop for refresh mechanism
// interface ProductsTableProps {
//   refreshKey?: number; // Optional key to trigger refresh
// }

// const ProductsTable: React.FC<ProductsTableProps> = ({ refreshKey }) => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchProducts = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const productsCollection = collection(firestore, "products");

//         const querySnapshot = await getDocs(productsCollection);
//         const fetchedProducts: Product[] = [];
//         querySnapshot.forEach((doc) => {
//           fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
//         });
//         setProducts(fetchedProducts);
//       } catch (err) {
//         console.error("Error fetching products: ", err);
//         setError(
//           "Failed to load special offer products. Please ensure Firebase is configured correctly."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//     // Add refreshKey to the dependency array
//     // When the key changes (passed from parent), this effect will re-run
//   }, [refreshKey]);

//   const handleRowClick = (product: Product) => {
//     setSelectedProduct(product);
//     setIsDetailDialogOpen(true);
//   };

//   const handleDialogClose = () => {
//     setIsDetailDialogOpen(false);
//     setSelectedProduct(null);
//   };

//   if (loading) {
//     return <div>Loading special offers...</div>;
//   }

//   if (error) {
//     return (
//       <div>
//         <p className="text-red-500 mb-4">{error}</p>
//         {products.length > 0 && (
//           <p className="text-orange-500 mb-4">
//             Displaying sample data due to error.
//           </p>
//         )}
//         {products.length > 0 ? (
//           <ProductsTableView products={products} onRowClick={handleRowClick} />
//         ) : (
//           <p>Could not load products.</p>
//         )}
//         {selectedProduct && (
//           <ProductDetailDialog
//             product={selectedProduct}
//             isOpen={isDetailDialogOpen}
//             onClose={handleDialogClose}
//           />
//         )}
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return <div>No special offer products found.</div>;
//   }

//   return (
//     <div>
//       <ProductsTableView products={products} onRowClick={handleRowClick} />
//       {selectedProduct && (
//         <ProductDetailDialog
//           product={selectedProduct}
//           isOpen={isDetailDialogOpen}
//           onClose={handleDialogClose}
//         />
//       )}
//     </div>
//   );
// };

// // Separate presentational component for the table view
// interface ProductsTableViewProps {
//   products: Product[];
//   onRowClick: (product: Product) => void;
// }

// const ProductsTableView: React.FC<ProductsTableViewProps> = ({
//   products,
//   onRowClick,
// }) => {
//   const t = useTranslations("trans");

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full rtl:text-right ltr:text-left">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="p-4 font-semibold text-gray-700">
//               {t("productLabels.code")}
//             </th>
//             <th className="p-4 font-semibold text-gray-700">
//               {t("productLabels.name")}
//             </th>
//             <th className="p-4 font-semibold text-gray-700">
//               {t("productLabels.price")}
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {products.map((product, index) => (
//             <tr
//               key={product.id || product.code}
//               onClick={() => onRowClick(product)}
//               className={`border-b ${
//                 index % 2 === 0 ? "bg-white" : "bg-gray-50"
//               } cursor-pointer hover:bg-muted/50 transition-colors`}
//             >
//               <td className="p-4 text-gray-800">{product.code}</td>
//               <td className="p-4 text-gray-800">{product.name || "N/A"}</td>
//               <td className="p-4 text-gray-800">${product.price.toFixed(2)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ProductsTable;

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
import { Product } from "@/lib/schemas";
import ProductDetailDialog from "./ProductDetailDialog";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const handleDeleteClick = async (productId: string) => {
    if (confirm(t("productLabels.confirmDelete"))) {
      try {
        await deleteDoc(doc(firestore, "products", productId));
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success("Product deleted successfully!");
        if (onProductDeleted) {
          onProductDeleted();
        }
      } catch (error) {
        console.error("Error deleting product: ", error);
        toast.error("Failed to delete product.");
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
    </div>
  );
};

interface ProductsTableViewProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
  onDeleteClick: (productId: string) => void;
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
                    {t("buttons.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      if (product.id) onDeleteClick(product.id);
                    }}
                  >
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
