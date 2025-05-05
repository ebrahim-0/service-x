"use client";

import { useToggleMenuScreenSize } from "@/hooks/toggle-menu-open.hook";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { toggle, isMobile, handleToggleMenu } = useToggleMenuScreenSize();

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex items-center",
        isMobile ? "justify-between" : "justify-end",
        "h-[65px] gap-4 px-6 bg-white border-b",
        "dark:bg-gray-800 dark:border-gray-700"
      )}
    >
      {isMobile && (
        <Link href="/" className="flex items-center h-16 px-6">
          <img src="/assets/logo.svg" alt="Logo" className="w-full h-12 mr-2" />
        </Link>
      )}

      <div className="flex items-center justify-between gap-5">
        <LanguageSwitcher />

        {isMobile && (
          <button
            onClick={handleToggleMenu}
            className="flex flex-col justify-center items-center w-10 h-10 space-y-1.5 group"
          >
            <span
              className={`h-1 w-8 bg-gray-900 rounded transition-transform ${
                toggle ? "rotate-45 translate-y-2.5" : ""
              }`}
            />
            <span
              className={`h-1 w-8 bg-gray-900 rounded transition-opacity ${
                toggle ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-1 w-8 bg-gray-900 rounded transition-transform ${
                toggle ? "-rotate-45 -translate-y-2.5" : ""
              }`}
            />
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
