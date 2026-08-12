"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type Address = {
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

type ApiResponse = {
  success: boolean;
  message?: string;
  addresses?: Address[];
};

type FormData = {
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
};

const emptyForm: FormData = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  isDefault: false,
};

export default function SavedAddressesPage() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD ADDRESSES
  // ==========================================

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/user/addresses", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login?from=/account/addresses");
        return;
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load saved addresses."
        );
      }

      setAddresses(data.addresses || []);
    } catch (err) {
      console.error("LOAD ADDRESSES ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load saved addresses."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target;
    const name = target.name;

    if (
      target instanceof HTMLInputElement &&
      target.type === "checkbox"
    ) {
      setForm((current) => ({
        ...current,
        [name]: target.checked,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: target.value,
    }));
  };

  // ==========================================
  // ADD ADDRESS
  // ==========================================

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ==========================================
  // EDIT ADDRESS
  // ==========================================

  const openEditForm = (address: Address) => {
    if (!address._id) return;

    setEditingId(address._id);

    setForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      pinCode: address.pinCode || "",
      isDefault: Boolean(address.isDefault),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  // ==========================================
  // SAVE / UPDATE ADDRESS
  // ==========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const phone = form.phone.replace(/\D/g, "");
    const pinCode = form.pinCode.replace(/\D/g, "");

    if (
      !form.fullName.trim() ||
      !phone ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !pinCode
    ) {
      setError("Please fill in all required address details.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit Indian phone number."
      );
      return;
    }

    if (!/^\d{6}$/.test(pinCode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        label: form.label.trim() || "Home",
        fullName: form.fullName.trim(),
        phone,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pinCode,
        isDefault: form.isDefault,
      };

      const url = editingId
        ? `/api/user/addresses/${editingId}`
        : "/api/user/addresses";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/login?from=/account/addresses");
        return;
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save address."
        );
      }

      setAddresses(data.addresses || []);

      setSuccess(
        data.message ||
          (editingId
            ? "Address updated successfully."
            : "Address saved successfully.")
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("SAVE ADDRESS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SET DEFAULT ADDRESS
  // ==========================================

  const handleSetDefault = async (address: Address) => {
    if (!address._id || address.isDefault) return;

    try {
      setDefaultId(address._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/user/addresses/${address._id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isDefault: true,
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/login?from=/account/addresses");
        return;
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update default address."
        );
      }

      setAddresses(data.addresses || []);

      setSuccess(
        data.message || "Default address updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update default address."
      );
    } finally {
      setDefaultId(null);
    }
  };

  // ==========================================
  // DELETE ADDRESS
  // ==========================================

  const handleDelete = async (address: Address) => {
    if (!address._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(address._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/user/addresses/${address._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        router.replace("/login?from=/account/addresses");
        return;
      }

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete address."
        );
      }

      setAddresses(data.addresses || []);

      setSuccess(
        data.message || "Address deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete address."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-pink-600" />

            <p className="mt-4 font-medium text-gray-600">
              Loading saved addresses...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600"
        >
          <ArrowLeft size={17} />
          Back to My Account
        </Link>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <MapPin className="text-pink-600" />
              Saved Addresses
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage your delivery addresses.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={18} />
            Add New Address
          </button>
        </div>

        {success && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <Check className="mr-2 inline h-4 w-4" />
            {success}
          </div>
        )}

        {error && !showForm && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
              <MapPin className="h-8 w-8 text-pink-600" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No saved addresses yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add an address for faster checkout.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700"
            >
              <Plus size={18} />
              Add Address
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {addresses.map((address, index) => (
              <div
                key={address._id || String(index)}
                className={`relative rounded-2xl bg-white p-6 shadow-sm ${
                  address.isDefault
                    ? "border-2 border-green-400"
                    : "border border-gray-200"
                }`}
              >
                {address.isDefault && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    <Check size={13} />
                    Default
                  </span>
                )}

                <div className="pr-20">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={19}
                      className="text-pink-600"
                    />

                    <h2 className="text-lg font-bold text-gray-900">
                      {address.label || "Home"}
                    </h2>
                  </div>

                  <p className="mt-5 font-bold text-gray-900">
                    {address.fullName}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    +91 {address.phone}
                  </p>

                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {address.address}
                    <br />
                    {address.city}, {address.state} -{" "}
                    {address.pinCode}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleSetDefault(address)
                      }
                      disabled={defaultId === address._id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 disabled:opacity-50"
                    >
                      {defaultId === address._id ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Check size={15} />
                      )}

                      Set Default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-pink-300 hover:text-pink-600"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(address)}
                    disabled={deletingId === address._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === address._id ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={15} />
                    )}

                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT ADDRESS MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                  Delivery Address
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {editingId
                    ? "Edit Address"
                    : "Add New Address"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Address Label"
                  name="label"
                  value={form.label}
                  placeholder="Home / Office"
                  onChange={handleChange}
                />

                <Input
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  placeholder="Enter full name"
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Mobile Number"
                  name="phone"
                  value={form.phone}
                  placeholder="10-digit mobile number"
                  onChange={handleChange}
                  maxLength={10}
                  required
                />

                <Input
                  label="PIN Code"
                  name="pinCode"
                  value={form.pinCode}
                  placeholder="6-digit PIN code"
                  onChange={handleChange}
                  maxLength={6}
                  required
                />

                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  placeholder="Enter city"
                  onChange={handleChange}
                  required
                />

                <Input
                  label="State"
                  name="state"
                  value={form.state}
                  placeholder="Enter state"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Address
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="House / Flat No., Street, Area, Landmark"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-pink-600"
                />

                <div>
                  <p className="font-semibold text-gray-900">
                    Set as default address
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    This address will be selected by default during
                    checkout.
                  </p>
                </div>
              </label>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingId
                        ? "Update Address"
                        : "Save Address"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// ==========================================
// INPUT COMPONENT
// ==========================================

function Input({
  label,
  name,
  value,
  placeholder,
  onChange,
  required = false,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        className="h-12 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
      />
    </div>
  );
}