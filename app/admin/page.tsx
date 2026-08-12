"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FolderOpen,
  IndianRupee,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";

interface Product {
  _id?: string;
  name?: string;
  sku?: string;
  sellingPrice?: number;
  status?: string;
  createdAt?: string;
}

interface Category {
  _id?: string;
  name?: string;
  status?: string;
}

interface OrderItem {
  productId?: string;
  product?: string;
  name?: string;
  productName?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  sellingPrice?: number;
  subtotal?: number;
}

interface Order {
  _id?: string;
  orderId?: string;
  customerName?: string;
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  status?: string;
  totalAmount?: number;
  grandTotal?: number;
  orderTotal?: number;
  total?: number;
  items?: OrderItem[];
  createdAt?: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalCategories: number;
  totalCustomers: number;
}

const initialStats: DashboardStats = {
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  totalCategories: 0,
  totalCustomers: 0,
};

const quickActions = [
  {
    title: "Products",
    description: "View and manage all products",
    href: "/admin/products",
    icon: Package,
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    title: "Add Product",
    description: "Create a new product",
    href: "/admin/add-product",
    icon: Plus,
    iconClass: "bg-green-100 text-green-600",
  },
  {
    title: "Orders",
    description: "View and manage customer orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    iconClass: "bg-orange-100 text-orange-600",
  },
  {
    title: "Categories",
    description: "Manage product categories",
    href: "/admin/categories",
    icon: FolderOpen,
    iconClass: "bg-purple-100 text-purple-600",
  },
];

function extractArray<T>(
  data: unknown,
  possibleKeys: string[]
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const objectData = data as Record<string, unknown>;

  for (const key of possibleKeys) {
    if (Array.isArray(objectData[key])) {
      return objectData[key] as T[];
    }
  }

  return [];
}

function getOrderAmount(order: Order): number {
  const directAmount =
    Number(
      order.totalAmount ??
        order.grandTotal ??
        order.orderTotal ??
        order.total ??
        0
    ) || 0;

  if (directAmount > 0) {
    return directAmount;
  }

  if (!Array.isArray(order.items)) {
    return 0;
  }

  return order.items.reduce((total, item) => {
    const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;

    const subtotal = Number(item.subtotal ?? 0) || 0;

    if (subtotal > 0) {
      return total + subtotal;
    }

    const price =
      Number(item.price ?? item.sellingPrice ?? 0) || 0;

    return total + price * quantity;
  }, 0);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date?: string): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getStatusClasses(status?: string): string {
  const normalizedStatus = status?.toLowerCase() || "";

  if (normalizedStatus === "confirmed") {
    return "bg-green-100 text-green-700";
  }

  if (normalizedStatus === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  if (normalizedStatus === "delivered") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        productsResponse,
        ordersResponse,
        categoriesResponse,
      ] = await Promise.all([
        fetch("/api/products", {
          cache: "no-store",
        }),
        fetch("/api/orders", {
          cache: "no-store",
        }),
        fetch("/api/categories", {
          cache: "no-store",
        }),
      ]);

      const [
        productsData,
        ordersData,
        categoriesData,
      ] = await Promise.all([
        productsResponse.json(),
        ordersResponse.json(),
        categoriesResponse.json(),
      ]);

      if (!productsResponse.ok) {
        throw new Error(
          productsData.error || "Failed to load products"
        );
      }

      if (!ordersResponse.ok) {
        throw new Error(
          ordersData.error || "Failed to load orders"
        );
      }

      if (!categoriesResponse.ok) {
        throw new Error(
          categoriesData.error || "Failed to load categories"
        );
      }

      const products = extractArray<Product>(
        productsData,
        ["products", "data"]
      );

      const orders = extractArray<Order>(
        ordersData,
        ["orders", "data"]
      );

      const categories = extractArray<Category>(
        categoriesData,
        ["categories", "data"]
      );

      const confirmedOrders = orders.filter(
        (order) =>
          order.status?.toLowerCase() === "confirmed"
      );

      const pendingOrders = orders.filter(
        (order) =>
          !order.status ||
          order.status.toLowerCase() === "pending"
      );

      const totalRevenue = confirmedOrders.reduce(
        (total, order) => total + getOrderAmount(order),
        0
      );

      const uniqueCustomers = new Set<string>();

      orders.forEach((order) => {
        const customerIdentifier =
          order.email?.trim().toLowerCase() ||
          order.phone?.trim() ||
          order.mobile?.trim() ||
          order.customerName?.trim().toLowerCase() ||
          order.name?.trim().toLowerCase();

        if (customerIdentifier) {
          uniqueCustomers.add(customerIdentifier);
        }
      });

      const sortedOrders = [...orders]
        .sort((firstOrder, secondOrder) => {
          const firstDate = new Date(
            firstOrder.createdAt || 0
          ).getTime();

          const secondDate = new Date(
            secondOrder.createdAt || 0
          ).getTime();

          return secondDate - firstDate;
        })
        .slice(0, 5);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders: pendingOrders.length,
        confirmedOrders: confirmedOrders.length,
        totalCategories: categories.length,
        totalCustomers: uniqueCustomers.size,
      });

      setRecentOrders(sortedOrders);
    } catch (loadError) {
      console.error("Dashboard load error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const analyticsCards = useMemo(
    () => [
      {
        title: "Total Products",
        value: stats.totalProducts.toString(),
        description: "Products added",
        icon: Package,
        iconClass: "bg-blue-100 text-blue-600",
      },
      {
        title: "Total Orders",
        value: stats.totalOrders.toString(),
        description: "All customer orders",
        icon: ShoppingCart,
        iconClass: "bg-purple-100 text-purple-600",
      },
      {
        title: "Total Revenue",
        value: formatCurrency(stats.totalRevenue),
        description: "From confirmed orders",
        icon: IndianRupee,
        iconClass: "bg-green-100 text-green-600",
      },
      {
        title: "Pending Orders",
        value: stats.pendingOrders.toString(),
        description: "Waiting for confirmation",
        icon: Clock3,
        iconClass: "bg-yellow-100 text-yellow-700",
      },
      {
        title: "Confirmed Orders",
        value: stats.confirmedOrders.toString(),
        description: "Successfully confirmed",
        icon: CheckCircle2,
        iconClass: "bg-emerald-100 text-emerald-600",
      },
      {
        title: "Categories",
        value: stats.totalCategories.toString(),
        description: "Product categories",
        icon: FolderOpen,
        iconClass: "bg-orange-100 text-orange-600",
      },
      {
        title: "Customers",
        value: stats.totalCustomers.toString(),
        description: "Unique order customers",
        icon: Users,
        iconClass: "bg-pink-100 text-pink-600",
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600" />

          <p className="mt-4 font-medium text-gray-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Welcome back. Here is your DianaKart business
              overview.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Dashboard data could not be loaded
              </p>

              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Business Analytics
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Live overview from products and orders.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {analyticsCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>

                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {card.value}
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
                    >
                      <Icon size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Quickly manage important store sections.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-md"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.iconClass}`}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-pink-600">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest five customer orders.
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="font-semibold text-pink-600 hover:text-pink-700"
              >
                View All Orders
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-10 text-center">
                <ShoppingCart
                  size={42}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-4 font-semibold text-gray-700">
                  No orders available
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  New orders will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-950 text-left text-sm text-white">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {recentOrders.map((order, index) => {
                        const orderKey =
                          order._id ||
                          order.orderId ||
                          `order-${index}`;

                        const customerName =
                          order.customerName ||
                          order.name ||
                          "Customer";

                        return (
                          <tr
                            key={orderKey}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {order.orderId ||
                                order._id?.slice(-8) ||
                                "—"}
                            </td>

                            <td className="px-6 py-4 text-gray-700">
                              {customerName}
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {formatDate(order.createdAt)}
                            </td>

                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {formatCurrency(
                                getOrderAmount(order)
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                                  order.status
                                )}`}
                              >
                                {order.status || "Pending"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <Link
                                href="/admin/orders"
                                className="font-semibold text-pink-600 hover:text-pink-700"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-gray-100 md:hidden">
                  {recentOrders.map((order, index) => {
                    const orderKey =
                      order._id ||
                      order.orderId ||
                      `mobile-order-${index}`;

                    return (
                      <div
                        key={orderKey}
                        className="space-y-3 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-900">
                              {order.orderId ||
                                order._id?.slice(-8) ||
                                "Order"}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {order.customerName ||
                                order.name ||
                                "Customer"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {order.status || "Pending"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {formatDate(order.createdAt)}
                          </span>

                          <span className="font-bold text-gray-900">
                            {formatCurrency(
                              getOrderAmount(order)
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}