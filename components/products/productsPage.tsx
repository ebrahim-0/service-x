"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddProductForm from "./AddProductForm";
import { useTranslations } from "next-intl";
import ProductsList from "./ProductsList";

// Basic Page component to render the ProductsTable and Add Product Dialog
export default function ProductsPage() {
  const t = useTranslations("trans");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // State to trigger refresh in ProductsTable. Increment key to force re-render/re-fetch.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProductAdded = useCallback(() => {
    // Increment key to trigger refresh in ProductsTable
    setRefreshKey((prevKey) => prevKey + 1);
    // Optionally close the dialog after adding
    // setIsAddDialogOpen(false); // Keep it open or close based on desired UX
  }, []);

  const closeAddDialog = useCallback(() => {
    setIsAddDialogOpen(false);
  }, []);

  return (
    <section>
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {t("productsPage.title")}
            </h1>
            {/* Add New Product Button and Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>{t("buttons.addNewProduct")}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t("buttons.addNewProduct")}</DialogTitle>
                </DialogHeader>
                {/* Pass callbacks to the form */}
                <AddProductForm
                  onProductAdded={handleProductAdded}
                  closeDialog={closeAddDialog}
                />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground mb-6">
            {t("productsPage.description")}
          </p>
          <ProductsList key={refreshKey} />
        </div>
      </div>
    </section>
  );
}
