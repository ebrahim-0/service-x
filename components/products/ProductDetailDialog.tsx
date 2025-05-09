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
import { Button } from "@/components/ui/button";
import { Product, Review } from "@/lib/schemas";
import AddReviewForm from "./AddReviewForm";
import EditProductForm from "./EditProductForm";
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase.browser";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ProductDetailDialogProps {
  product: Product;
  isOpen: boolean;
  isEditMode?: boolean; // New prop to initialize in edit mode
  onClose: () => void;
  onProductUpdated?: () => void;
  onProductDeleted?: () => void;
}

const ProductDetailDialog: React.FC<ProductDetailDialogProps> = ({
  product,
  isOpen,
  isEditMode = false,
  onClose,
  onProductUpdated,
  onProductDeleted,
}) => {
  const t = useTranslations("trans");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(isEditMode);

  const fetchReviews = async (productId: string) => {
    if (!productId) return;
    setLoadingReviews(true);
    setReviewError(null);
    try {
      const productDocRef = doc(firestore, "products", productId);
      const reviewsSubcollectionRef = collection(productDocRef, "reviews");
      const q = query(reviewsSubcollectionRef, orderBy("reviewDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedReviews: Review[] = [];
      querySnapshot.forEach((reviewDoc) => {
        const data = reviewDoc.data();
        fetchedReviews.push({
          ...data,
          id: reviewDoc.id,
          reviewDate: (data.reviewDate as Timestamp).toDate(),
          productId: productId,
        } as Review);
      });
      setReviews(fetchedReviews);
    } catch (err) {
      console.error("Error fetching reviews: ", err);
      setReviewError("Failed to load reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (isOpen && product.id) {
      fetchReviews(product.id);
    }
  }, [isOpen, product.id]);

  const handleReviewAdded = () => {
    if (product.id) {
      fetchReviews(product.id);
    }
  };

  const handleDelete = async () => {
    if (!product.id) return;
    if (confirm(t("productLabels.confirmDelete"))) {
      try {
        await deleteDoc(doc(firestore, "products", product.id));
        toast.success("Product deleted successfully!");
        if (onProductDeleted) {
          onProductDeleted();
        }
        onClose();
      } catch (error) {
        console.error("Error deleting product: ", error);
        toast.error("Failed to delete product.");
      }
    }
  };

  const handleProductUpdated = () => {
    setEditMode(false);
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {t("productLabels.code")}: {product.code}
          </DialogDescription>
        </DialogHeader>
        {editMode ? (
          <EditProductForm
            product={product}
            onProductUpdated={handleProductUpdated}
            onCancel={onClose}
          />
        ) : (
          <div className="grid gap-4 py-4">
            {product.imageUrl && (
              <div className="relative h-48 w-full mb-4">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-md"
                />
              </div>
            )}
            <p>
              <strong>{t("productLabels.description")}:</strong>{" "}
              {product.description}
            </p>
            <p>
              <strong>{t("productLabels.price")}:</strong> {t("currencySymbol")}
              {product.price.toFixed(2)}
            </p>
            {product.unmissableOffer && (
              <p className="text-green-600 font-semibold">
                {t("product.unmissableOffer")}
              </p>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                {t("productLabels.reviews")}
                {reviews.length > 0 && ` (${reviews.length})`}
              </h3>
              {loadingReviews && <p>{t("loadingReviews")}</p>}
              {reviewError && <p className="text-red-500">{reviewError}</p>}
              {!loadingReviews && !reviewError && reviews.length === 0 && (
                <p>{t("noReviews")}</p>
              )}
              {!loadingReviews && !reviewError && reviews.length > 0 && (
                <div className="space-y-4 max-h-60 overflow-y-auto border p-4 rounded-md">
                  {reviews.map((review, index) => (
                    <div
                      key={review.id || index}
                      className="border-b pb-2 mb-2 last:border-b-0"
                    >
                      <p>
                        <strong>{review.reviewerName}</strong> (
                        {"⭐".repeat(review.rating)})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.reviewDate.toLocaleDateString()}
                      </p>
                      <p>{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                {t("productLabels.addReview")}
                {product.id && ` (${product.id})`}
              </h3>
              {product.id ? (
                <AddReviewForm
                  productId={product.id}
                  onReviewAdded={handleReviewAdded}
                />
              ) : (
                <p className="text-red-500">{t("productLabels.noProductId")}</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          {!editMode && (
            <Button variant="outline" onClick={onClose}>
              {t("buttons.close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
