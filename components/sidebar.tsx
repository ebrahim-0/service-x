"use client";

import { LogOut, Menu, Package, ShoppingCart, Users, X } from "lucide-react";
import { Button } from "./ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase.browser";
import { toast } from "sonner";
import { useToggleMenuScreenSize } from "@/hooks/toggle-menu-open.hook";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSelector } from "zustore";
import { Drawer } from "./drawer";

const Sidebar = () => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const t = useTranslations("trans");

  const user = useSelector("user");

  const { handleToggleMenu, toggle, isMobile } = useToggleMenuScreenSize();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t("messages.success.logout"));
      replace("/login");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("messages.error.logout");
      toast.error(errorMessage);
    }
  };

  const menuItems = [
    {
      name: t("sidebar.users"),
      path: "/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: t("sidebar.orders"),
      path: "/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      name: t("sidebar.products"),
      path: "/products",
      icon: <Package className="w-5 h-5" />,
    },
    {
      name: t("home.createAdmin"),
      path: "/register-admin",
      icon: <Package className="w-5 h-5" />,
    },
  ];

  const isActive = (path: string) => {
    return (
      pathname.startsWith(path) || (path.includes(pathname) && pathname !== "/")
    );
  };

  const sidebarContent = (
    <div
      className={cn(
        "sticky inset-y-0 flex flex-col no-scrollbar overflow-y-scroll overflow-x-visible top-0 h-dvh w-64 border bg-white shadow-sm"
      )}
    >
      <Link href="/" className="flex items-center h-16 px-6 border-b">
        <img src="/assets/logo.svg" alt="Logo" className="w-full h-12 mr-2" />
      </Link>

      <div className="flex-1 py-4 overflow-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-sm rounded-md",
                isActive(item.path)
                  ? "bg-gray-100 text-gray-900 font-medium dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              {item.icon}
              <span className="rtl:mr-3 ltr:ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center mb-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="rounded-full size-10"
            />
          ) : (
            <div className="flex items-center justify-center bg-blue-100 rounded-full size-10">
              <span className="text-lg font-medium text-blue-500">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div className="rtl:mr-3 ltr:ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.displayName || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="justify-start w-full cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("home.logout")}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={!!toggle} onClose={handleToggleMenu}>
        {sidebarContent}
      </Drawer>
    );
  }

  return <aside>{sidebarContent}</aside>;

  return (
    <>
      <Button
        onClick={handleToggleMenu}
        variant="ghost"
        className={cn(
          "fixed z-50 top-4 md:hidden",
          toggle ? "ltr:left-4 rtl:right-4" : "ltr:left-4 rtl:right-4"
        )}
        size="icon"
      >
        {toggle ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}

      {isMobile ? (
        <Drawer isOpen={!!toggle} onClose={handleToggleMenu}>
          {sidebarContent}
        </Drawer>
      ) : (
        <aside>{sidebarContent}</aside>
      )}
    </>
  );
};

export default Sidebar;
