"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Eye,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Completed";

type OrderItem = {
  productId: string;
  sku?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
};

type Order = {
  _id: string;

  orderId: string;

  userId?: string;

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

type OrdersApiResponse = {
  success: boolean;
  orders?: Order[];
  order?: Order;
  message?: string;
};

const statusStyles: Record<
  OrderStatus,
  string
> = {
  Pending:
    "bg-yellow-100 text-yellow-800",

  Confirmed:
    "bg-blue-100 text-blue-800",

  Completed:
    "bg-green-100 text-green-800",
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

export default function AdminOrdersPage() {
  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "All" | OrderStatus
    >("All");

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<string | null>(
      null
    );

  const fetchOrders =
    async (
      showRefreshLoader =
        false
    ) => {
      try {
        if (
          showRefreshLoader
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await fetch(
            "/api/orders",
            {
              method:
                "GET",

              cache:
                "no-store",

              credentials:
                "include",
            }
          );

        const data =
          (await response.json()) as OrdersApiResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to fetch orders."
          );
        }

        setOrders(
          data.orders || []
        );
      } catch (
        fetchError
      ) {
        console.error(
          "Fetch admin orders error:",
          fetchError
        );

        setError(
          fetchError instanceof
            Error
            ? fetchError.message
            : "Failed to fetch orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(
          false
        );
      }
    };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const updateOrderStatus =
    async (
      order: Order,
      status: OrderStatus
    ) => {
      try {
        setUpdatingOrderId(
          order._id
        );

        setError("");

        const response =
          await fetch(
            `/api/orders/${order._id}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify(
                  {
                    status,
                  }
                ),
            }
          );

        const data =
          (await response.json()) as OrdersApiResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.order
        ) {
          throw new Error(
            data.message ||
              "Failed to update order."
          );
        }

        const updatedOrder =
          data.order;

        setOrders(
          (
            currentOrders
          ) =>
            currentOrders.map(
              (
                currentOrder
              ) =>
                currentOrder._id ===
                updatedOrder._id
                  ? updatedOrder
                  : currentOrder
            )
        );

        setSelectedOrder(
          updatedOrder
        );
      } catch (
        updateError
      ) {
        console.error(
          "Update order status error:",
          updateError
        );

        setError(
          updateError instanceof
            Error
            ? updateError.message
            : "Failed to update order."
        );
      } finally {
        setUpdatingOrderId(
          null
        );
      }
    };

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const matchesSearch =
            !query ||
            order.orderId
              .toLowerCase()
              .includes(
                query
              ) ||
            order.customerName
              .toLowerCase()
              .includes(
                query
              ) ||
            order.phone
              .toLowerCase()
              .includes(
                query
              ) ||
            (
              order.email ||
              ""
            )
              .toLowerCase()
              .includes(
                query
              );

          const matchesStatus =
            statusFilter ===
              "All" ||
            order.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      orders,
      search,
      statusFilter,
    ]);

  const summary =
    useMemo(
      () => ({
        total:
          orders.length,

        pending:
          orders.filter(
            (order) =>
              order.status ===
              "Pending"
          ).length,

        confirmed:
          orders.filter(
            (order) =>
              order.status ===
              "Confirmed"
          ).length,

        completed:
          orders.filter(
            (order) =>
              order.status ===
              "Completed"
          ).length,

        totalValue:
          orders.reduce(
            (
              total,
              order
            ) =>
              total +
              Number(
                order.totalAmount ||
                  0
              ),
            0
          ),
      }),
      [orders]
    );

  return (
    <main className="h-[calc(100vh-1rem)] overflow-hidden bg-gray-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        {/* HEADER */}

        <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <ShoppingCart className="h-8 w-8 text-pink-600" />

              Orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage DianaKart customer orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchOrders(
                true
              )
            }
            disabled={
              refreshing
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-pink-300 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* SUMMARY */}

        <section className="mt-5 grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Total Orders"
            value={String(
              summary.total
            )}
          />

          <SummaryCard
            label="Pending"
            value={String(
              summary.pending
            )}
            valueClass="text-yellow-700"
          />

          <SummaryCard
            label="Confirmed"
            value={String(
              summary.confirmed
            )}
            valueClass="text-blue-700"
          />

          <SummaryCard
            label="Completed"
            value={String(
              summary.completed
            )}
            valueClass="text-green-700"
          />

          <SummaryCard
            label="Order Value"
            value={formatCurrency(
              summary.totalValue
            )}
            valueClass="text-pink-600"
          />
        </section>

        {/* ORDERS SECTION */}

        <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* SEARCH + FILTER */}

          <div className="shrink-0 flex flex-col gap-4 border-b border-gray-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Search order ID, customer, phone or email"
                className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event
                    .target
                    .value as
                    | "All"
                    | OrderStatus
                )
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            >
              <option value="All">
                All Statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Confirmed">
                Confirmed
              </option>

              <option value="Completed">
                Completed
              </option>
            </select>
          </div>

          {/* CONTENT */}

          {loading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-pink-600" />

                <p className="mt-3 text-sm font-medium text-gray-500">
                  Loading orders...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center">
              <div>
                <p className="font-semibold text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void fetchOrders()
                  }
                  className="mt-5 rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
                  <Package className="h-8 w-8 text-pink-600" />
                </div>

                <h2 className="mt-5 text-xl font-bold text-gray-900">
                  No orders found
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  No orders match the selected filter.
                </p>
              </div>
            </div>
          ) : (
            /*
              IMPORTANT:
              This area gets its own vertical
              and horizontal scroll.
            */
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-[1180px] w-full border-separate border-spacing-0">
                {/* STICKY TABLE HEADER */}

                <thead className="sticky top-0 z-20 bg-gray-50 shadow-[0_1px_0_0_#f3f4f6]">
                  <tr>
                    <TableHeading>
                      Order
                    </TableHeading>

                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Items
                    </TableHeading>

                    <TableHeading>
                      Amount
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Date
                    </TableHeading>

                    {/* STICKY ACTION HEADER */}

                    <th className="sticky right-0 z-30 min-w-[110px] border-l border-gray-100 bg-gray-50 px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500 shadow-[-6px_0_10px_-10px_rgba(0,0,0,0.35)]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {filteredOrders.map(
                    (
                      order
                    ) => (
                      <tr
                        key={
                          order._id
                        }
                        className="group"
                      >
                        <td className="whitespace-nowrap border-b border-gray-100 px-5 py-4 group-hover:bg-pink-50/40">
                          <p className="font-semibold text-gray-900">
                            {
                              order.orderId
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Cash on Delivery
                          </p>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 group-hover:bg-pink-50/40">
                          <p className="font-semibold text-gray-900">
                            {
                              order.customerName
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {
                              order.phone
                            }
                          </p>
                        </td>

                        <td className="border-b border-gray-100 px-5 py-4 group-hover:bg-pink-50/40">
                          <div className="flex min-w-[300px] items-center gap-3">
                            <img
                              src={
                                order
                                  .items[0]
                                  ?.image ||
                                "/products/placeholder.jpg"
                              }
                              alt={
                                order
                                  .items[0]
                                  ?.name ||
                                "Product"
                              }
                              className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  "/products/placeholder.jpg";
                              }}
                            />

                            <div className="min-w-0">
                              <p className="max-w-[310px] truncate font-semibold text-gray-900">
                                {order
                                  .items[0]
                                  ?.name ||
                                  "Product"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Qty:{" "}
                                {order
                                  .items[0]
                                  ?.quantity ||
                                  0}
                              </p>

                              {order.items[0]?.size && (
                                <p className="mt-1 text-xs font-semibold text-pink-600">
                                  Size:{" "}
                                  {
                                    order
                                      .items[0]
                                      .size
                                  }
                                </p>
                              )}

                              {order
                                .items
                                .length >
                                1 && (
                                <p className="mt-1 text-xs font-semibold text-pink-600">
                                  +
                                  {order
                                    .items
                                    .length -
                                    1}{" "}
                                  more item
                                  {order
                                    .items
                                    .length >
                                  2
                                    ? "s"
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap border-b border-gray-100 px-5 py-4 text-sm font-bold text-gray-900 group-hover:bg-pink-50/40">
                          {formatCurrency(
                            order.totalAmount
                          )}
                        </td>

                        <td className="whitespace-nowrap border-b border-gray-100 px-5 py-4 group-hover:bg-pink-50/40">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              statusStyles[
                                order
                                  .status
                              ]
                            }`}
                          >
                            {
                              order.status
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap border-b border-gray-100 px-5 py-4 text-sm text-gray-600 group-hover:bg-pink-50/40">
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        {/* STICKY VIEW COLUMN */}

                        <td className="sticky right-0 z-10 whitespace-nowrap border-b border-l border-gray-100 bg-white px-5 py-4 text-right shadow-[-6px_0_10px_-10px_rgba(0,0,0,0.35)] group-hover:bg-pink-50">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-pink-300 hover:text-pink-600"
                          >
                            <Eye className="h-4 w-4" />

                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ORDER DETAILS POPUP */}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* POPUP HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Order Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {
                    selectedOrder.orderId
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close order details"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* CUSTOMER */}

              <section className="grid gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Customer
                  </p>

                  <p className="mt-2 font-semibold text-gray-900">
                    {
                      selectedOrder.customerName
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {
                      selectedOrder.phone
                    }
                  </p>

                  {selectedOrder.email && (
                    <p className="mt-1 text-sm text-gray-600">
                      {
                        selectedOrder.email
                      }
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Delivery Address
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {
                      selectedOrder.address
                    }
                    ,{" "}
                    {
                      selectedOrder.city
                    }
                    ,{" "}
                    {
                      selectedOrder.state
                    }{" "}
                    -{" "}
                    {
                      selectedOrder.pinCode
                    }
                  </p>
                </div>
              </section>

              {/* ITEMS */}

              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    Ordered Items
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      statusStyles[
                        selectedOrder
                          .status
                      ]
                    }`}
                  >
                    {
                      selectedOrder.status
                    }
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedOrder.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center gap-4 rounded-xl border border-gray-100 p-4"
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

                          {item.sku && (
                            <div className="mt-2">
                              <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                                Product Code / SKU:{" "}
                                {
                                  item.sku
                                }
                              </span>
                            </div>
                          )}

                          {item.size && (
                            <div className="mt-2">
                              <span className="inline-flex rounded-lg bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">
                                Size:{" "}
                                {
                                  item.size
                                }
                              </span>
                            </div>
                          )}

                          <p className="mt-2 text-sm text-gray-500">
                            {formatCurrency(
                              item.price
                            )}{" "}
                            ×{" "}
                            {
                              item.quantity
                            }
                          </p>
                        </div>

                        <p className="shrink-0 font-bold text-gray-900">
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

              {/* TOTAL */}

              <section className="rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Total Items
                  </span>

                  <span className="font-semibold text-gray-900">
                    {
                      selectedOrder.totalItems
                    }
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-gray-600">
                  <span>
                    Payment Method
                  </span>

                  <span className="font-semibold text-gray-900">
                    Cash on Delivery
                  </span>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-end justify-between">
                    <span className="font-semibold text-gray-700">
                      Total Amount
                    </span>

                    <span className="text-2xl font-bold text-pink-600">
                      {formatCurrency(
                        selectedOrder.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </section>

              {/* STATUS BUTTONS */}

              {selectedOrder.status ===
                "Pending" && (
                <button
                  type="button"
                  onClick={() =>
                    void updateOrderStatus(
                      selectedOrder,
                      "Confirmed"
                    )
                  }
                  disabled={
                    updatingOrderId ===
                    selectedOrder._id
                  }
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingOrderId ===
                  selectedOrder._id
                    ? "Updating..."
                    : "Confirm Order"}
                </button>
              )}

              {selectedOrder.status ===
                "Confirmed" && (
                <button
                  type="button"
                  onClick={() =>
                    void updateOrderStatus(
                      selectedOrder,
                      "Completed"
                    )
                  }
                  disabled={
                    updatingOrderId ===
                    selectedOrder._id
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingOrderId ===
                  selectedOrder._id ? (
                    "Updating..."
                  ) : (
                    <>
                      <CheckCircle2
                        size={
                          19
                        }
                      />

                      Complete Order
                    </>
                  )}
                </button>
              )}

              {selectedOrder.status ===
                "Completed" && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-4 text-center font-semibold text-green-700">
                  <CheckCircle2
                    size={20}
                  />

                  Order Completed
                </div>
              )}

              <p className="text-xs text-gray-400">
                Ordered on{" "}
                {formatDate(
                  selectedOrder.createdAt
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="bg-gray-50 px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}

function SummaryCard({
  label,
  value,
  valueClass =
    "text-gray-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}