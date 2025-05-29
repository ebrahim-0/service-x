import { z } from "zod";

// Assuming 't' is a translation function passed in
export const productSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(), // Add ID field, likely from Firestore document ID
    code: z.string().min(1, t("errors.code_required")),
    name: z.string().min(1, t("errors.name_required")),
    description: z.string().min(1, t("errors.description_required")),
    imageUrl: z.string().url().optional(), // Store image URL instead of File object
    price: z.coerce.number().positive(t("errors.positive_number")),
    unmissableOffer: z.boolean().optional(), // Special data field
    userId: z.string().optional(), // User ID of the user who created this product
  });

export type Product = z.infer<ReturnType<typeof productSchema>>;

// Define the Review schema
export const reviewSchema = z.object({
  id: z.string().optional(), // Optional ID for the review, if needed
  productId: z.string(),
  reviewerName: z.string().min(1, "Reviewer name is required"),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  reviewDate: z.date(),
});

export type Review = z.infer<typeof reviewSchema>;

// Schema for the Add Product Form, including image file handling
export const addProductFormSchema = (t: (key: string) => string) =>
  z.object({
    code: z.string().min(1, t("errors.code_required")),
    name: z.string().min(1, t("errors.name_required")),
    description: z.string().min(1, t("errors.description_required")),
    imageFile: z.instanceof(File).optional(),
    price: z.coerce.number().positive(t("errors.positive_number")),
    unmissableOffer: z.boolean().optional(),
  });

export type AddProductFormData = z.infer<
  ReturnType<typeof addProductFormSchema>
>;

// Schema for the Add Review Form
export const addReviewFormSchema = z.object({
  reviewerName: z.string().min(1, "Reviewer name is required"),
  rating: z.coerce
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

export type AddReviewFormData = z.infer<typeof addReviewFormSchema>;
