"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addProductFormSchema,
  AddProductFormData,
  Product,
} from "@/lib/schemas";
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
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebase/firebase.browser";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface EditProductFormProps {
  product: Product;
  onProductUpdated: () => void;
  onCancel: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  product,
  onProductUpdated,
  onCancel,
}) => {
  const t = useTranslations("trans");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema(t)),
    defaultValues: {
      code: product.code,
      name: product.name,
      description: product.description,
      price: product.price,
      unmissableOffer: product.unmissableOffer,
      imageFile: undefined,
    },
  });

  const onSubmit = async (data: AddProductFormData) => {
    if (!product.id) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        let imageUrl = product.imageUrl;
        // Upload new image if provided
        if (data.imageFile) {
          const imageRef = ref(
            storage,
            `products/${Date.now()}_${data.imageFile.name}`
          );
          const snapshot = await uploadBytes(imageRef, data.imageFile);
          imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Update product data in Firestore
        if (!product.id) {
          throw new Error("Product ID is undefined.");
        }

        const productRef = doc(firestore, "products", product.id);
        await updateDoc(productRef, {
          code: data.code,
          name: data.name,
          description: data.description,
          price: data.price,
          unmissableOffer: data.unmissableOffer || false,
          imageUrl: imageUrl,
          updatedAt: new Date(),
        });

        toast.success("Product updated successfully!");
        form.reset(data); // Reset form with current values
        onProductUpdated();
      } catch (error) {
        console.error("Error updating product: ", error);
        setSubmitError("Failed to update product. Please try again.");
        toast.error("Failed to update product.");
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
                  placeholder={t("placeholders.productCode")}
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
              {product.imageUrl && (
                <p className="text-sm text-muted-foreground">
                  Current image will be replaced if a new one is uploaded.
                </p>
              )}
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
        <div className="flex justify-between">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("buttons.updating") : t("buttons.updateProduct")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("buttons.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditProductForm;
