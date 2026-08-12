"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
  try {
    setLoggingOut(true);

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    const responseText = await response.text();

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

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || "Admin logout failed."
      );
    }

    router.replace("/admin-login");
    router.refresh();
  } catch (error) {
    console.error("Admin logout error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Admin logout failed."
    );
  } finally {
    setLoggingOut(false);
  }
};

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-64 shrink-0 flex-col bg-black p-5 text-white">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="DianaKart"
            width={170}
            height={60}
            priority
            className="object-contain"
          />
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <Package size={20} />
            Products
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <ShoppingCart size={20} />
            Orders
          </Link>

          <Link
            href="/admin/customers"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <Users size={20} />
            Customers
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <FolderOpen size={20} />
            Categories
          </Link>

          <Link
            href="/admin/banners"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <ImageIcon size={20} />
            Banner Management
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-gray-800"
          >
            <Settings size={20} />
            Website Settings
          </Link>
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
                <Loader2 size={20} className="animate-spin" />
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
      </aside>

      <main className="min-w-0 flex-1 p-6">
        {children}
      </main>
    </div>
  );
}