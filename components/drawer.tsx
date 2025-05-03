"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Drawer = ({ isOpen, onClose, children }: DrawerProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay (Click to Close) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 bg-opacity-50 z-[9998]"
          onClick={onClose}
        ></div>
      )}

      {/* Drawer Container */}
      <div
        className={cn(
          "fixed rtl:right-0 ltr:left-0 top-0 transition-transform z-[9999999] h-full overflow-y-auto no-scrollbar",
          isOpen
            ? "translate-x-0"
            : "ltr:-translate-x-full rtl:translate-x-full"
        )}
      >
        {children}
      </div>
    </>
  );
};
