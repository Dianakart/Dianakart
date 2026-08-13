"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  UserRound,
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
  size?: string;
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

type OrderResponse = {
  success?: boolean;
  message?: string;
  order?: Order;
};

const statusStyles: Record<
  OrderStatus,
  string
> = {
  Pending:
    "bg-yellow-100 text-yellow-800 border-yellow-200",

  Confirmed:
    "bg-blue-100 text-blue-800 border-blue-200",

  Completed:
    "bg-green-100 text-green-800 border-green-200",
};

function formatCurrency(
  value: number
) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

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

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id ===
    "string"
      ? params.id
      : "";

  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadOrder =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/user/orders/${id}`,
            {
              method:
                "GET",
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const data =
          (await response.json()) as OrderResponse;

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
          !data.success ||
          !data.order
        ) {
          throw new Error(
            data.message ||
              "Unable to load order details."
          );
        }

        setOrder(
          data.order
        );
      } catch (
        loadError
      ) {
        console.error(
          "Order details error:",
          loadError
        );

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (id) {
      void loadOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-pink-600" />

          <p className="mt-4 font-medium text-gray-600">
            Loading order details...
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !order
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-red-500" />

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Unable to Load Order
          </h1>

          <p className="mt-3 text-gray-500">
            {error ||
              "Order not found."}
          </p>

          <Link
            href="/orders"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700"
          >
            <ArrowLeft
              size={18}
            />
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600"
        >
          <ArrowLeft
            size={18}
          />
          Back to My Orders
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-gray-100 bg-gray-50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Order ID
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                {
                  order.orderId
                }
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays
                  size={
                    16
                  }
                />

                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-bold ${
                statusStyles[
                  order.status
                ]
              }`}
            >
              {
                order.status
              }
            </span>
          </div>

          <div className="space-y-8 p-6">
            {/* STATUS MESSAGE */}

            <section className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-pink-600" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    {order.status ===
                    "Pending"
                      ? "Order Received"
                      : order.status ===
                        "Confirmed"
                      ? "Order Confirmed"
                      : "Order Completed"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {order.status ===
                    "Pending"
                      ? "We have received your order."
                      : order.status ===
                        "Confirmed"
                      ? "Your order has been confirmed."
                      : "Your order has been completed successfully."}
                  </p>
                </div>
              </div>
            </section>

            {/* ITEMS */}

            <section>
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-pink-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Ordered Items
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                {order.items.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
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
                        <p className="font-semibold text-gray-900">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          Price:{" "}
                          {formatCurrency(
                            item.price
                          )}
                        </p>

                        {item.size && (
                          <div className="mt-2">
                            <span className="inline-flex rounded-lg bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                              Size: {item.size}
                            </span>
                          </div>
                        )}

                        <p className="mt-2 text-sm text-gray-500">
                          Quantity:{" "}
                          {
                            item.quantity
                          }
                        </p>
                      </div>

                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(
                          item.price *
                            item.quantity
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* CUSTOMER + ADDRESS */}

            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-pink-600" />

                  <h3 className="font-bold text-gray-900">
                    Customer Details
                  </h3>
                </div>

                <p className="mt-4 font-semibold text-gray-900">
                  {
                    order.customerName
                  }
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  {
                    order.phone
                  }
                </p>

                {order.email && (
                  <p className="mt-1 text-sm text-gray-600">
                    {
                      order.email
                    }
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-pink-600" />

                  <h3 className="font-bold text-gray-900">
                    Delivery Address
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-700">
                  {
                    order.address
                  }
                  ,{" "}
                  {
                    order.city
                  }
                  ,{" "}
                  {
                    order.state
                  }{" "}
                  -{" "}
                  {
                    order.pinCode
                  }
                </p>
              </div>
            </section>

            {/* PAYMENT + TOTAL */}

            <section className="rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-pink-600" />

                <h3 className="font-bold text-gray-900">
                  Payment Summary
                </h3>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Payment Method
                  </span>

                  <span className="font-semibold text-gray-900">
                    Cash on Delivery
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Total Items
                  </span>

                  <span className="font-semibold text-gray-900">
                    {
                      order.totalItems
                    }
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-end justify-between">
                    <span className="font-semibold text-gray-700">
                      Total Amount
                    </span>

                    <span className="text-2xl font-bold text-pink-600">
                      {formatCurrency(
                        order.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}