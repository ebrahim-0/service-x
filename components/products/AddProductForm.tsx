"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addProductFormSchema, AddProductFormData } from "@/lib/schemas";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebase/firebase.browser";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AddProductFormProps {
  onProductAdded?: () => void; // Optional callback after product is added
  closeDialog?: () => void; // Optional callback to close the dialog
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  onProductAdded,
  closeDialog,
}) => {
  const t = useTranslations("trans"); // If using next-intl

  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddProductFormData>({
    // Use the schema that includes imageFile
    resolver: zodResolver(addProductFormSchema(t)),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      price: 0,
      unmissableOffer: false,
      imageFile: undefined,
    },
  });

  const onSubmit = async (data: AddProductFormData) => {
    setSubmitError(null);
    startTransition(async () => {
      try {
        let imageUrl = "";
        // 1. Upload image if provided
        if (data.imageFile) {
          const imageRef = ref(
            storage,
            `products/${Date.now()}_${data.imageFile.name}`
          );
          const snapshot = await uploadBytes(imageRef, data.imageFile);
          imageUrl = await getDownloadURL(snapshot.ref);
        }

        // 2. Add product data to Firestore
        const productsCollection = collection(firestore, "products");
        await addDoc(productsCollection, {
          code: data.code,
          name: data.name,
          description: data.description,
          price: data.price,
          unmissableOffer: data.unmissableOffer || false,
          imageUrl: imageUrl, // Store the URL
          createdAt: new Date(), // Optional: add a timestamp
        });

        toast.success("Product added successfully!");
        form.reset(); // Reset form fields
        if (onProductAdded) {
          onProductAdded(); // Trigger any refresh logic
        }
        if (closeDialog) {
          closeDialog(); // Close the dialog
        }
      } catch (error) {
        console.error("Error adding product: ", error);
        setSubmitError(
          "Failed to add product. Please check Firebase setup and try again."
        );
        toast.error("Failed to add product.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.code")}</FormLabel>
              <FormControl>
                <Input
                  // placeholder={t("placeholders.productCode")}
                  placeholder={t("productLabels.code")}
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("placeholders.productName")}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("placeholders.productDescription")}
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("productLabels.price")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={t("placeholders.productPrice")}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
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
          name="imageFile"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>{t("productLabels.image")}</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    onChange(event.target.files && event.target.files[0])
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
          name="unmissableOffer"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t("productLabels.unmissableOffer")}</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {submitError && (
          <p className="text-sm font-medium text-destructive">{submitError}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? t("buttons.adding") : t("buttons.addProduct")}
        </Button>
      </form>
    </Form>
  );
};

export default AddProductForm;
