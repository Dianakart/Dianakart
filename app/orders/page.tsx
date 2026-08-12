"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Completed";

type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  orderId: string;

  customerName: string;
  phone: string;
  email?: string;

  address: string;
  city: string;
  state: string;
  pinCode: string;

  items: OrderItem[];

  totalItems: number;
  totalAmount: number;

  paymentMethod: "COD";

  status: OrderStatus;

  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  success?: boolean;
  message?: string;
  orders?: Order[];
};

/* ========================================
   ORDER STATUS BADGE
======================================== */

const statusStyles: Record<
  OrderStatus,
  string
> = {
  Pending:
    "border border-yellow-300 bg-yellow-100 text-yellow-900",

  Confirmed:
    "border border-blue-300 bg-blue-100 text-blue-900",

  Completed:
    "border border-green-300 bg-green-100 text-green-900",
};

/* ========================================
   CURRENCY
======================================== */

function formatCurrency(
  value: number
) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

/* ========================================
   DATE
======================================== */

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* ========================================
   PAGE
======================================== */

export default function MyOrdersPage() {
  const router =
    useRouter();

  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================
     FETCH ORDERS
  ======================================== */

  const fetchOrders =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/user/orders",
            {
              method: "GET",
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const data =
          (await response.json()) as OrdersResponse;

        if (
          response.status ===
          401
        ) {
          router.push(
            "/login"
          );

          return;
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load your orders."
          );
        }

        setOrders(
          data.orders || []
        );
      } catch (
        fetchError
      ) {
        console.error(
          "My orders error:",
          fetchError
        );

        setError(
          fetchError instanceof
            Error
            ? fetchError.message
            : "Unable to load your orders."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void fetchOrders();
  }, []);

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-pink-600" />

          <p className="mt-4 font-medium text-gray-600">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  /* ========================================
     PAGE UI
  ======================================== */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-pink-600"
        >
          <ArrowLeft
            size={18}
          />

          Back to Shopping
        </Link>

        {/* TITLE */}

        <div className="mt-6">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <ShoppingBag className="h-8 w-8 text-pink-600" />

            My Orders
          </h1>

          <p className="mt-2 text-gray-500">
            View your DianaKart order
            history and status.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void fetchOrders()
              }
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* NO ORDERS */}

        {!error &&
        orders.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-50">
              <Package className="h-10 w-10 text-pink-600" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="mt-3 text-gray-500">
              Your orders will appear
              here after checkout.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              Start Shopping
            </Link>
          </section>
        ) : (
          <div className="mt-8 space-y-5">

            {/* ORDERS */}

            {orders.map(
              (order) => (
                <article
                  key={
                    order._id
                  }
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >

                  {/* ORDER HEADER */}

                  <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Order ID
                      </p>

                      <p className="mt-1 font-bold text-gray-900">
                        {
                          order.orderId
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                      {/* CLEAR STATUS BADGE */}

                      <span
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm ${
                          statusStyles[
                            order.status
                          ]
                        }`}
                      >
                        {
                          order.status
                        }
                      </span>

                      <span className="text-xs font-medium text-gray-500">
                        {formatDate(
                          order.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  {/* PRODUCTS */}

                  <div className="p-5">
                    <div className="space-y-4">
                      {order.items.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={`${item.productId}-${index}`}
                            className="flex items-center gap-4"
                          >
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                              <img
                                src={
                                  item.image ||
                                  "/products/placeholder.jpg"
                                }
                                alt={
                                  item.name
                                }
                                className="h-full w-full object-cover"
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.src =
                                    "/products/placeholder.jpg";
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 font-semibold text-gray-900">
                                {
                                  item.name
                                }
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                Quantity:{" "}
                                {
                                  item.quantity
                                }
                              </p>

                              <p className="mt-1 text-sm font-bold text-gray-900">
                                {formatCurrency(
                                  item.price *
                                    item.quantity
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* BOTTOM */}

                    <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-500">
                          Payment:{" "}
                          <span className="font-semibold text-gray-700">
                            Cash on Delivery
                          </span>
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            order.totalItems
                          }{" "}
                          item(s)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <p className="text-xl font-bold text-pink-600">
                          {formatCurrency(
                            order.totalAmount
                          )}
                        </p>

                        {/* VIEW DETAILS */}

                        <Link
                          href={`/orders/${order._id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
                        >
                          <Eye
                            size={17}
                          />

                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}