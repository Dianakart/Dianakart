"use client";

import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import {
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.error(
          "Non-JSON logout response:",
          responseText
        );

        throw new Error(
          `Logout API is not working. Status: ${response.status}`
        );
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
            "Admin logout failed."
        );
      }

      router.replace("/admin-login");
      router.refresh();
    } catch (error) {
      console.error(
        "Admin logout error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Admin logout failed."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      label: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: FolderOpen,
    },
    {
      label: "Banner Management",
      href: "/admin/banners",
      icon: ImageIcon,
    },
    {
      label: "Website Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-1 justify-center">
          <Image
            src="/logo.png"
            alt="DianaKart"
            width={170}
            height={60}
            priority
            className="object-contain"
          />
        </div>

        <button
          type="button"
          onClick={closeMobileMenu}
          className="ml-2 rounded-lg p-2 text-white transition hover:bg-gray-800 lg:hidden"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 rounded-lg p-3 transition ${
                active
                  ? "bg-gray-800 text-white"
                  : "text-white hover:bg-gray-800"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-800 pt-5">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-red-600 p-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />
              Logging Out...
            </>
          ) : (
            <>
              <LogOut size={20} />
              Logout
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(true)
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900"
          aria-label="Open admin menu"
        >
          <Menu size={24} />
        </button>

        <Image
          src="/logo.png"
          alt="DianaKart"
          width={125}
          height={44}
          priority
          className="h-auto object-contain"
        />

        <div className="h-10 w-10" />
      </header>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-black p-5 text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 shrink-0 flex-col bg-black p-5 text-white lg:flex">
          <SidebarContent />
        </aside>

        {/* PAGE CONTENT */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}