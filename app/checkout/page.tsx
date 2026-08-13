"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  PackageCheck,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

type CheckoutForm = {
  label: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  paymentMethod: "cod";
};

type SavedAddress = {
  _id?: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type AddressApiResponse = {
  success?: boolean;
  message?: string;
  user?: Customer;
  address?: SavedAddress;
  addresses?: SavedAddress[];
};

const emptyForm: CheckoutForm = {
  label: "Home",
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  paymentMethod: "cod",
};

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    clearCart,
  } = useCart();

  const [form, setForm] =
    useState<CheckoutForm>(emptyForm);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [addresses, setAddresses] =
    useState<SavedAddress[]>([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState("");

  const [addressMode, setAddressMode] =
    useState<"saved" | "new">("saved");

  const [loadingAddresses, setLoadingAddresses] =
    useState(true);

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [deletingAddressId, setDeletingAddressId] =
    useState("");

  const [updatingDefaultId, setUpdatingDefaultId] =
    useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [orderPlaced, setOrderPlaced] =
    useState(false);

  const [placedOrderId, setPlacedOrderId] =
    useState("");

  const [placedOrderAmount, setPlacedOrderAmount] =
    useState(0);

  const totalQuantity = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      ),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price) *
            item.quantity,
        0
      ),
    [cart]
  );

  const totalAmount = subtotal;

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      setError("");

      const response = await fetch(
        "/api/user/addresses",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as AddressApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load saved addresses."
        );
      }

      const loadedAddresses =
        data.addresses || [];

      setCustomer(data.user || null);
      setAddresses(loadedAddresses);

      if (data.user) {
        setForm((previous) => ({
          ...previous,
          fullName:
            previous.fullName ||
            data.user?.name ||
            "",
          phone:
            previous.phone ||
            data.user?.phone ||
            "",
          email:
            previous.email ||
            data.user?.email ||
            "",
        }));
      }

      if (loadedAddresses.length === 0) {
        setAddressMode("new");
        setSelectedAddressId("");
        return;
      }

      const defaultAddress =
        loadedAddresses.find(
          (item) =>
            item.isDefault
        ) || loadedAddresses[0];

      const addressId =
        defaultAddress._id || "";

      setSelectedAddressId(
        addressId
      );

      setAddressMode("saved");
    } catch (loadError) {
      console.error(
        "Checkout address load error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load saved addresses."
      );
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const selectedAddress =
    addresses.find(
      (item) =>
        item._id ===
        selectedAddressId
    ) || null;

  const handleChange = (
    event: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    let cleanValue = value;

    if (name === "phone") {
      cleanValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    if (name === "pinCode") {
      cleanValue = value
        .replace(/\D/g, "")
        .slice(0, 6);
    }

    setForm((previous) => ({
      ...previous,
      [name]: cleanValue,
    }));

    setError("");
    setSuccessMessage("");
  };

  const startNewAddress = () => {
    setAddressMode("new");
    setSelectedAddressId("");

    setForm({
      ...emptyForm,
      fullName:
        customer?.name || "",
      phone:
        customer?.phone || "",
      email:
        customer?.email || "",
    });

    setError("");
    setSuccessMessage("");
  };

  const validateAddressForm = () => {
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pinCode.trim()
    ) {
      setError(
        "Please fill in all required delivery details."
      );

      return false;
    }

    if (
      !/^[6-9]\d{9}$/.test(
        form.phone.trim()
      )
    ) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );

      return false;
    }

    if (
      !/^\d{6}$/.test(
        form.pinCode.trim()
      )
    ) {
      setError(
        "Please enter a valid 6-digit PIN code."
      );

      return false;
    }

    return true;
  };

  const saveNewAddress = async () => {
    if (!validateAddressForm()) {
      return;
    }

    try {
      setSavingAddress(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/user/addresses",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            label:
              form.label.trim() ||
              "Home",
            fullName:
              form.fullName.trim(),
            phone:
              form.phone.trim(),
            address:
              form.address.trim(),
            city:
              form.city.trim(),
            state:
              form.state.trim(),
            pinCode:
              form.pinCode.trim(),
            isDefault:
              addresses.length === 0,
          }),
        }
      );

      const data =
        (await response.json()) as AddressApiResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save address."
        );
      }

      const updatedAddresses =
        data.addresses || [];

      setAddresses(
        updatedAddresses
      );

      const newlySaved =
        data.address;

      if (
        newlySaved?._id
      ) {
        setSelectedAddressId(
          newlySaved._id
        );
      } else if (
        updatedAddresses.length > 0
      ) {
        setSelectedAddressId(
          updatedAddresses[
            updatedAddresses.length - 1
          ]._id || ""
        );
      }

      setAddressMode("saved");

      setSuccessMessage(
        "Address saved successfully."
      );
    } catch (saveError) {
      console.error(
        "Save address error:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const setDefaultAddress =
    async (
      addressId: string
    ) => {
      if (!addressId) {
        return;
      }

      try {
        setUpdatingDefaultId(
          addressId
        );

        setError("");

        const response = await fetch(
          `/api/user/addresses/${addressId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              isDefault: true,
            }),
          }
        );

        const data =
          (await response.json()) as AddressApiResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to update default address."
          );
        }

        setAddresses(
          data.addresses || []
        );

        setSelectedAddressId(
          addressId
        );

        setSuccessMessage(
          "Default address updated."
        );
      } catch (defaultError) {
        console.error(
          "Default address error:",
          defaultError
        );

        setError(
          defaultError instanceof Error
            ? defaultError.message
            : "Unable to update default address."
        );
      } finally {
        setUpdatingDefaultId("");
      }
    };

  const deleteAddress =
    async (
      addressId: string
    ) => {
      if (!addressId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this address?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingAddressId(
          addressId
        );

        setError("");
        setSuccessMessage("");

        const response = await fetch(
          `/api/user/addresses/${addressId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data =
          (await response.json()) as AddressApiResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to delete address."
          );
        }

        const updatedAddresses =
          data.addresses || [];

        setAddresses(
          updatedAddresses
        );

        if (
          updatedAddresses.length === 0
        ) {
          setSelectedAddressId("");
          setAddressMode("new");

          setForm({
            ...emptyForm,
            fullName:
              customer?.name || "",
            phone:
              customer?.phone || "",
            email:
              customer?.email || "",
          });
        } else {
          const nextAddress =
            updatedAddresses.find(
              (item) =>
                item.isDefault
            ) ||
            updatedAddresses[0];

          setSelectedAddressId(
            nextAddress._id || ""
          );
        }

        setSuccessMessage(
          "Address deleted successfully."
        );
      } catch (deleteError) {
        console.error(
          "Delete address error:",
          deleteError
        );

        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete address."
        );
      } finally {
        setDeletingAddressId("");
      }
    };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (cart.length === 0) {
      setError(
        "Your cart is empty."
      );

      return;
    }

    let deliveryDetails: {
      fullName: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      state: string;
      pinCode: string;
    };

    if (
      addressMode === "saved"
    ) {
      if (!selectedAddress) {
        setError(
          "Please select a delivery address."
        );

        return;
      }

      deliveryDetails = {
        fullName:
          selectedAddress.fullName,
        phone:
          selectedAddress.phone,
        email:
          customer?.email || "",
        address:
          selectedAddress.address,
        city:
          selectedAddress.city,
        state:
          selectedAddress.state,
        pinCode:
          selectedAddress.pinCode,
      };
    } else {
      if (!validateAddressForm()) {
        return;
      }

      deliveryDetails = {
        fullName:
          form.fullName.trim(),
        phone:
          form.phone.trim(),
        email:
          form.email.trim(),
        address:
          form.address.trim(),
        city:
          form.city.trim(),
        state:
          form.state.trim(),
        pinCode:
          form.pinCode.trim(),
      };
    }

    try {
      setPlacingOrder(true);

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            customerName:
              deliveryDetails.fullName,

            phone:
              deliveryDetails.phone,

            email:
              deliveryDetails.email,

            address:
              deliveryDetails.address,

            city:
              deliveryDetails.city,

            state:
              deliveryDetails.state,

            pinCode:
              deliveryDetails.pinCode,

            paymentMethod:
              "COD",

            items: cart.map(
              (item) => ({
                productId:
                  String(item.id),

                name:
                  item.name,

                image:
                  item.image,

                price:
                  Number(
                    item.price
                  ),

                quantity:
                  item.quantity,

                size:
                  item.size || "",
              })
            ),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to place order."
        );
      }

      setPlacedOrderId(
        data.order?.orderId || ""
      );

      setPlacedOrderAmount(
        Number(
          data.order?.totalAmount ??
            totalAmount
        )
      );

      clearCart();

      setOrderPlaced(true);
    } catch (orderError) {
      console.error(
        "Order placement error:",
        orderError
      );

      setError(
        orderError instanceof Error
          ? orderError.message
          : "Unable to place order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (
    loadingAddresses
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-pink-600" />

          <p className="mt-4 font-medium text-gray-600">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-11 w-11 text-green-600" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Order Placed Successfully
          </h1>

          <p className="mx-auto mt-3 max-w-md text-gray-500">
            Thank you for shopping with
            DianaKart. Your order has
            been received.
          </p>

          {placedOrderId && (
            <div className="mt-6 rounded-xl bg-pink-50 px-5 py-4">
              <p className="text-sm text-gray-500">
                Order ID
              </p>

              <p className="mt-1 text-lg font-bold text-pink-600">
                {placedOrderId}
              </p>
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-gray-50 p-5 text-left">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Payment
              </span>

              <span className="font-semibold text-gray-900">
                Cash on Delivery
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4">
              <span className="text-gray-500">
                Total Amount
              </span>

              <span className="font-bold text-gray-900">
                ₹
                {placedOrderAmount.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              Continue Shopping
            </Link>

            <Link
              href="/orders"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-pink-600"
          >
            <ArrowLeft size={18} />
            Back to Cart
          </Link>

          <h1 className="mt-5 flex items-center gap-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            <ShoppingBag className="h-8 w-8 text-pink-600" />
            Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Select your delivery address
            and review your order.
          </p>
        </div>

        {cart.length === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-50">
              <ShoppingBag className="h-10 w-10 text-pink-600" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-3 text-gray-500">
              Add products before
              proceeding to checkout.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              Browse Products
            </Link>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-8 lg:grid-cols-[1fr_380px]"
          >
            <div className="space-y-6">
              {/* ADDRESS SECTION */}

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-50">
                      <MapPin className="h-5 w-5 text-pink-600" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Delivery Address
                      </h2>

                      <p className="text-sm text-gray-500">
                        Choose a saved
                        address or add a new
                        one.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startNewAddress}
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-50 px-4 py-2.5 text-sm font-bold text-pink-600 transition hover:bg-pink-100"
                  >
                    <Plus size={17} />
                    Add New Address
                  </button>
                </div>

                {addresses.length > 0 && (
                  <div className="mt-7 grid gap-4">
                    {addresses.map(
                      (item) => {
                        const id =
                          item._id || "";

                        const selected =
                          addressMode ===
                            "saved" &&
                          selectedAddressId ===
                            id;

                        return (
                          <div
                            key={id}
                            className={`rounded-2xl border-2 p-5 transition ${
                              selected
                                ? "border-pink-500 bg-pink-50/40"
                                : "border-gray-200 bg-white hover:border-pink-200"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddressMode(
                                    "saved"
                                  );

                                  setSelectedAddressId(
                                    id
                                  );

                                  setError(
                                    ""
                                  );
                                }}
                                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? "border-pink-600 bg-pink-600 text-white"
                                    : "border-gray-300"
                                }`}
                              >
                                {selected && (
                                  <Check
                                    size={
                                      13
                                    }
                                  />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-gray-900">
                                    {
                                      item.fullName
                                    }
                                  </p>

                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                    {
                                      item.label
                                    }
                                  </span>

                                  {item.isDefault && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                                      <Star
                                        size={
                                          12
                                        }
                                        className="fill-current"
                                      />
                                      Default
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                  {
                                    item.address
                                  }
                                  ,{" "}
                                  {
                                    item.city
                                  }
                                  ,{" "}
                                  {
                                    item.state
                                  }{" "}
                                  -{" "}
                                  {
                                    item.pinCode
                                  }
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                  Mobile:{" "}
                                  {
                                    item.phone
                                  }
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {!item.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDefaultAddress(
                                          id
                                        )
                                      }
                                      disabled={
                                        updatingDefaultId ===
                                        id
                                      }
                                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-pink-300 hover:text-pink-600 disabled:opacity-50"
                                    >
                                      {updatingDefaultId ===
                                      id
                                        ? "Updating..."
                                        : "Set Default"}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteAddress(
                                        id
                                      )
                                    }
                                    disabled={
                                      deletingAddressId ===
                                      id
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                  >
                                    {deletingAddressId ===
                                    id ? (
                                      <Loader2
                                        size={
                                          14
                                        }
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Trash2
                                        size={
                                          14
                                        }
                                      />
                                    )}

                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {/* NEW ADDRESS FORM */}

                {addressMode === "new" && (
                  <div className="mt-7 rounded-2xl border border-pink-200 bg-pink-50/30 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Home className="h-5 w-5 text-pink-600" />

                      <h3 className="text-lg font-bold text-gray-900">
                        Add New Address
                      </h3>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Address Label
                        </label>

                        <select
                          name="label"
                          value={
                            form.label
                          }
                          onChange={
                            handleChange
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        >
                          <option value="Home">
                            Home
                          </option>

                          <option value="Office">
                            Office
                          </option>

                          <option value="Other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Full Name *
                        </label>

                        <input
                          name="fullName"
                          value={
                            form.fullName
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Full name"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Mobile Number *
                        </label>

                        <input
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={
                            form.phone
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="10-digit mobile number"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Email
                        </label>

                        <input
                          name="email"
                          type="email"
                          value={
                            form.email
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Email"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Full Address *
                        </label>

                        <textarea
                          name="address"
                          rows={4}
                          value={
                            form.address
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="House number, street, area and landmark"
                          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          City *
                        </label>

                        <input
                          name="city"
                          value={
                            form.city
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="City"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          State *
                        </label>

                        <input
                          name="state"
                          value={
                            form.state
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="State"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          PIN Code *
                        </label>

                        <input
                          name="pinCode"
                          inputMode="numeric"
                          maxLength={6}
                          value={
                            form.pinCode
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="6-digit PIN code"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        saveNewAddress
                      }
                      disabled={
                        savingAddress
                      }
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 font-bold text-white transition hover:bg-black disabled:opacity-60"
                    >
                      {savingAddress ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <MapPin
                            size={
                              18
                            }
                          />
                          Save Address
                        </>
                      )}
                    </button>
                  </div>
                )}
              </section>

              {/* PAYMENT */}

              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-50">
                    <CreditCard className="h-5 w-5 text-pink-600" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Payment Method
                    </h2>

                    <p className="text-sm text-gray-500">
                      Online payment will
                      be added next.
                    </p>
                  </div>
                </div>

                <label className="mt-6 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-pink-500 bg-pink-50 p-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={
                      form.paymentMethod ===
                      "cod"
                    }
                    onChange={
                      handleChange
                    }
                    className="h-4 w-4 accent-pink-600"
                  />

                  <Truck className="h-6 w-6 text-pink-600" />

                  <div>
                    <p className="font-semibold text-gray-900">
                      Cash on Delivery
                    </p>

                    <p className="text-sm text-gray-500">
                      Pay when your order
                      is delivered.
                    </p>
                  </div>
                </label>
              </section>
            </div>

            {/* ORDER SUMMARY */}

            <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-6 w-6 text-pink-600" />

                <h2 className="text-2xl font-bold text-gray-900">
                  Order Summary
                </h2>
              </div>

              <div className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
                {cart.map(
                  (item) => (
                    <div
                      key={`${item.id}-${item.size || "no-size"}`}
                      className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                          {
                            item.name
                          }
                        </p>

                        {item.size && (
                          <div className="mt-2">
                            <span className="inline-flex rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-600">
                              Size: {item.size}
                            </span>
                          </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                          Quantity:{" "}
                          {
                            item.quantity
                          }
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-gray-900">
                        ₹
                        {(
                          Number(
                            item.price
                          ) *
                          item.quantity
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Total Items
                  </span>

                  <span className="font-semibold text-gray-900">
                    {
                      totalQuantity
                    }
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal
                  </span>

                  <span className="font-semibold text-gray-900">
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-gray-200" />

              <div className="flex items-end justify-between gap-4">
                <p className="font-medium text-gray-600">
                  Total Amount
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  ₹
                  {totalAmount.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              {successMessage && (
                <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {
                    successMessage
                  }
                </p>
              )}

              {error && (
                <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  placingOrder
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3.5 font-bold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                By placing the order, you
                confirm that the delivery
                details are correct.
              </p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}