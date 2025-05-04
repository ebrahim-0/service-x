"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addReviewFormSchema, AddReviewFormData } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore"; // Import doc
import { firestore } from "@/lib/firebase/firebase.browser";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AddReviewFormProps {
  productId: string;
  onReviewAdded: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({
  productId,
  onReviewAdded,
}) => {
  const t = useTranslations("trans");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddReviewFormData>({
    resolver: zodResolver(addReviewFormSchema),
    defaultValues: {
      reviewerName: "",
      rating: 5,
      comment: "",
    },
  });

  const onSubmit = async (data: AddReviewFormData) => {
    setSubmitError(null);
    startTransition(async () => {
      try {
        // *** MODIFIED: Get reference to the product document and its 'reviews' subcollection ***
        const productDocRef = doc(firestore, "products", productId);
        const reviewsSubcollectionRef = collection(productDocRef, "reviews");

        // Add the new review to the subcollection
        await addDoc(reviewsSubcollectionRef, {
          // productId is implicitly known, but we keep it if schema requires
          productId: productId,
          reviewerName: data.reviewerName,
          rating: data.rating,
          comment: data.comment,
          reviewDate: serverTimestamp(),
        });

        toast.success(t("review_added_successfully"));
        form.reset();
        onReviewAdded();
      } catch (error) {
        console.error("Error submitting review: ", error);
        setSubmitError("Failed to submit review. Please try again.");
        toast.error("Failed to submit review.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reviewerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.reviewerName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("placeholders.reviewerName")}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.rating")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 1)
                  }
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.comment")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("placeholders.comment")}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {submitError && (
          <p className="text-sm font-medium text-destructive">{submitError}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? t("submitting") : t("buttons.submitReview")}
        </Button>
      </form>
    </Form>
  );
};

export default AddReviewForm;
