"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Eye,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  Users,
  X,
} from "lucide-react";

interface OrderItem {
  _id?: string;
  productId?: string;
  product?: string;
  name?: string;
  productName?: string;
  image?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
}

interface Order {
  _id?: string;
  orderId?: string;

  customerName?: string;
  phone?: string;
  email?: string;

  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  items?: OrderItem[];

  totalItems?: number;
  totalAmount?: number;

  paymentMethod?: string;
  status?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface OrdersApiResponse {
  success?: boolean;
  orders?: Order[];
  message?: string;
  error?: string;
}

interface Customer {
  id: string;
  customerName: string;
  phone: string;
  email: string;

  address: string;
  city: string;
  state: string;
  pinCode: string;

  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;

  totalSpending: number;
  totalOrderValue: number;

  firstOrderDate: string;
  lastOrderDate: string;

  orders: Order[];
}

function normalizeText(value?: string): string {
  return String(value || "").trim();
}

function normalizePhone(value?: string): string {
  return normalizeText(value).replace(/\D/g, "");
}

function normalizeEmail(value?: string): string {
  return normalizeText(value).toLowerCase();
}

function getCustomerKey(order: Order, index: number): string {
  const phone = normalizePhone(order.phone);

  if (phone) {
    return `phone-${phone}`;
  }

  const email = normalizeEmail(order.email);

  if (email) {
    return `email-${email}`;
  }

  const name = normalizeText(order.customerName).toLowerCase();

  if (name) {
    return `name-${name}`;
  }

  return `unknown-customer-${index}`;
}

function getOrderAmount(order: Order): number {
  const directAmount = Number(order.totalAmount || 0);

  if (directAmount > 0) {
    return directAmount;
  }

  if (!Array.isArray(order.items)) {
    return 0;
  }

  return order.items.reduce((total, item) => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const subtotal = Number(item.subtotal || 0);

    if (subtotal > 0) {
      return total + subtotal;
    }

    return total + price * quantity;
  }, 0);
}

function getOrderItemsCount(order: Order): number {
  const directTotal = Number(order.totalItems || 0);

  if (directTotal > 0) {
    return directTotal;
  }

  if (!Array.isArray(order.items)) {
    return 0;
  }

  return order.items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
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

function getDateValue(date?: string): number {
  if (!date) {
    return 0;
  }

  const parsedDate = new Date(date).getTime();

  return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function getStatusClasses(status?: string): string {
  const normalizedStatus = normalizeText(status).toLowerCase();

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

function createCustomersFromOrders(orders: Order[]): Customer[] {
  const customerMap = new Map<string, Customer>();

  orders.forEach((order, index) => {
    const customerKey = getCustomerKey(order, index);
    const existingCustomer = customerMap.get(customerKey);

    const orderDate = order.createdAt || "";
    const orderStatus = normalizeText(order.status).toLowerCase();
    const orderAmount = getOrderAmount(order);

    const isConfirmed = orderStatus === "confirmed";
    const isPending = !orderStatus || orderStatus === "pending";

    if (!existingCustomer) {
      customerMap.set(customerKey, {
        id: customerKey,

        customerName:
          normalizeText(order.customerName) || "Unknown Customer",

        phone: normalizeText(order.phone),
        email: normalizeText(order.email),

        address: normalizeText(order.address),
        city: normalizeText(order.city),
        state: normalizeText(order.state),
        pinCode: normalizeText(order.pinCode),

        totalOrders: 1,
        confirmedOrders: isConfirmed ? 1 : 0,
        pendingOrders: isPending ? 1 : 0,

        totalSpending: isConfirmed ? orderAmount : 0,
        totalOrderValue: orderAmount,

        firstOrderDate: orderDate,
        lastOrderDate: orderDate,

        orders: [order],
      });

      return;
    }

    existingCustomer.totalOrders += 1;
    existingCustomer.totalOrderValue += orderAmount;

    if (isConfirmed) {
      existingCustomer.confirmedOrders += 1;
      existingCustomer.totalSpending += orderAmount;
    }

    if (isPending) {
      existingCustomer.pendingOrders += 1;
    }

    if (
      getDateValue(orderDate) >
      getDateValue(existingCustomer.lastOrderDate)
    ) {
      existingCustomer.lastOrderDate = orderDate;

      existingCustomer.customerName =
        normalizeText(order.customerName) ||
        existingCustomer.customerName;

      existingCustomer.phone =
        normalizeText(order.phone) || existingCustomer.phone;

      existingCustomer.email =
        normalizeText(order.email) || existingCustomer.email;

      existingCustomer.address =
        normalizeText(order.address) || existingCustomer.address;

      existingCustomer.city =
        normalizeText(order.city) || existingCustomer.city;

      existingCustomer.state =
        normalizeText(order.state) || existingCustomer.state;

      existingCustomer.pinCode =
        normalizeText(order.pinCode) || existingCustomer.pinCode;
    }

    if (
      !existingCustomer.firstOrderDate ||
      getDateValue(orderDate) <
        getDateValue(existingCustomer.firstOrderDate)
    ) {
      existingCustomer.firstOrderDate = orderDate;
    }

    existingCustomer.orders.push(order);
  });

  return Array.from(customerMap.values())
    .map((customer) => ({
      ...customer,

      orders: [...customer.orders].sort(
        (firstOrder, secondOrder) =>
          getDateValue(secondOrder.createdAt) -
          getDateValue(firstOrder.createdAt)
      ),
    }))
    .sort(
      (firstCustomer, secondCustomer) =>
        getDateValue(secondCustomer.lastOrderDate) -
        getDateValue(firstCustomer.lastOrderDate)
    );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      const data: OrdersApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to load customers"
        );
      }

      const orders = Array.isArray(data.orders) ? data.orders : [];

      setCustomers(createCustomersFromOrders(orders));
    } catch (loadError) {
      console.error("Customer load error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customers"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCustomer(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      const searchableText = [
        customer.customerName,
        customer.phone,
        customer.email,
        customer.address,
        customer.city,
        customer.state,
        customer.pinCode,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [customers, searchTerm]);

  const statistics = useMemo(() => {
    const totalConfirmedSpending = customers.reduce(
      (total, customer) => total + customer.totalSpending,
      0
    );

    const totalCustomerOrders = customers.reduce(
      (total, customer) => total + customer.totalOrders,
      0
    );

    const repeatCustomers = customers.filter(
      (customer) => customer.totalOrders > 1
    ).length;

    return {
      totalCustomers: customers.length,
      totalCustomerOrders,
      totalConfirmedSpending,
      repeatCustomers,
    };
  }, [customers]);

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600" />

          <p className="mt-4 font-medium text-gray-600">
            Loading customers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl">
          {/* Page heading */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customers Management
              </h1>

              <p className="mt-2 text-gray-600">
                View customers automatically collected from their
                orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadCustomers(true)}
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

          {/* Error */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Customers could not be loaded
                </p>

                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Customers
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {statistics.totalCustomers}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Unique order customers
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                  <Users size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Customer Orders
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {statistics.totalCustomerOrders}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    All customer orders
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <ShoppingBag size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Confirmed Spending
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(
                      statistics.totalConfirmedSpending
                    )}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Confirmed orders only
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <IndianRupee size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Repeat Customers
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {statistics.repeatCustomers}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    More than one order
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <UserRound size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Customer table */}

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Customer List
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Showing {filteredCustomers.length} of{" "}
                    {customers.length} customers
                  </p>
                </div>

                <div className="relative w-full md:max-w-md">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search name, phone, email or city..."
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <Users
                  size={50}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-4 text-lg font-bold text-gray-800">
                  {searchTerm
                    ? "No matching customers found"
                    : "No customers available"}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm
                    ? "Try a different search keyword."
                    : "Customers will appear after an order is placed."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1050px]">
                    <thead className="bg-slate-950 text-left text-sm text-white">
                      <tr>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4 text-center">
                          Orders
                        </th>
                        <th className="px-6 py-4">
                          Confirmed Spending
                        </th>
                        <th className="px-6 py-4">
                          Last Order
                        </th>
                        <th className="px-6 py-4 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-600">
                                {customer.customerName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-bold text-gray-900">
                                  {customer.customerName}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  Customer since{" "}
                                  {formatDate(
                                    customer.firstOrderDate
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-1.5 text-sm">
                              <p className="flex items-center gap-2 text-gray-700">
                                <Phone
                                  size={15}
                                  className="text-gray-400"
                                />

                                {customer.phone || "—"}
                              </p>

                              <p className="flex items-center gap-2 text-gray-500">
                                <Mail
                                  size={15}
                                  className="text-gray-400"
                                />

                                {customer.email || "No email"}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {[customer.city, customer.state]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                              {customer.totalOrders}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-bold text-gray-900">
                            {formatCurrency(
                              customer.totalSpending
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(customer.lastOrderDate)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCustomer(customer)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}

                <div className="divide-y divide-gray-100 lg:hidden">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="space-y-5 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-600">
                            {customer.customerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900">
                              {customer.customerName}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {customer.phone || "No phone"}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                          {customer.totalOrders} order
                          {customer.totalOrders === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
                        <div>
                          <p className="text-xs text-gray-500">
                            Confirmed Spending
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            {formatCurrency(
                              customer.totalSpending
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Last Order
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            {formatDate(customer.lastOrderDate)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCustomer(customer)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition hover:bg-pink-700"
                      >
                        <Eye size={17} />
                        View Customer Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Customer popup */}

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={() => setSelectedCustomer(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white p-5 md:p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Customer Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Contact information and complete order history.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="Close customer details"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-7 p-5 md:p-6">
              {/* Customer profile */}

              <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
                      {selectedCustomer.customerName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-bold text-gray-900">
                        {selectedCustomer.customerName}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Customer since{" "}
                        {formatDate(
                          selectedCustomer.firstOrderDate
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone
                        size={19}
                        className="mt-0.5 shrink-0 text-pink-600"
                      />

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Phone
                        </p>

                        <p className="mt-1 font-semibold text-gray-800">
                          {selectedCustomer.phone || "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail
                        size={19}
                        className="mt-0.5 shrink-0 text-pink-600"
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Email
                        </p>

                        <p className="mt-1 break-all font-semibold text-gray-800">
                          {selectedCustomer.email ||
                            "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin
                        size={19}
                        className="mt-0.5 shrink-0 text-pink-600"
                      />

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Address
                        </p>

                        <p className="mt-1 font-semibold leading-6 text-gray-800">
                          {[
                            selectedCustomer.address,
                            selectedCustomer.city,
                            selectedCustomer.state,
                            selectedCustomer.pinCode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer statistics */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                    <p className="text-sm text-purple-700">
                      Total Orders
                    </p>

                    <p className="mt-2 text-3xl font-bold text-purple-800">
                      {selectedCustomer.totalOrders}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm text-green-700">
                      Confirmed
                    </p>

                    <p className="mt-2 text-3xl font-bold text-green-800">
                      {selectedCustomer.confirmedOrders}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                    <p className="text-sm text-yellow-700">
                      Pending
                    </p>

                    <p className="mt-2 text-3xl font-bold text-yellow-800">
                      {selectedCustomer.pendingOrders}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-sm text-blue-700">
                      Confirmed Spending
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-800">
                      {formatCurrency(
                        selectedCustomer.totalSpending
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order history */}

              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Order History
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    All orders placed by this customer.
                  </p>
                </div>

                <div className="space-y-4">
                  {selectedCustomer.orders.map(
                    (order, orderIndex) => (
                      <div
                        key={
                          order._id ||
                          order.orderId ||
                          `customer-order-${orderIndex}`
                        }
                        className="overflow-hidden rounded-xl border border-gray-200"
                      >
                        <div className="flex flex-col gap-3 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold text-gray-900">
                              {order.orderId ||
                                order._id ||
                                "Order"}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {formatDate(order.createdAt)} •{" "}
                              {getOrderItemsCount(order)} item
                              {getOrderItemsCount(order) === 1
                                ? ""
                                : "s"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                                order.status
                              )}`}
                            >
                              {order.status || "Pending"}
                            </span>

                            <span className="font-bold text-gray-900">
                              {formatCurrency(
                                getOrderAmount(order)
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          {Array.isArray(order.items) &&
                          order.items.length > 0 ? (
                            <div className="space-y-3">
                              {order.items.map(
                                (item, itemIndex) => (
                                  <div
                                    key={
                                      item._id ||
                                      item.productId ||
                                      `item-${itemIndex}`
                                    }
                                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-gray-800">
                                        {item.productName ||
                                          item.name ||
                                          "Product"}
                                      </p>

                                      <p className="mt-1 text-sm text-gray-500">
                                        Quantity:{" "}
                                        {Number(
                                          item.quantity || 1
                                        )}
                                      </p>
                                    </div>

                                    <p className="shrink-0 font-bold text-gray-900">
                                      {formatCurrency(
                                        Number(
                                          item.subtotal ||
                                            Number(
                                              item.price || 0
                                            ) *
                                              Number(
                                                item.quantity || 1
                                              )
                                        )
                                      )}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Product information is not
                              available.
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                            <p>
                              Payment:{" "}
                              <span className="font-semibold text-gray-800">
                                {order.paymentMethod || "COD"}
                              </span>
                            </p>

                            <p>
                              Order Value:{" "}
                              <span className="font-semibold text-gray-800">
                                {formatCurrency(
                                  getOrderAmount(order)
                                )}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}