"use client";

import {
  AlertCircle,
  CheckCircle2,
  Facebook,
  Globe2,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Search,
  Settings,
  Store,
  Upload,
  X,
} from "lucide-react";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

interface WebsiteSettingsData {
  _id?: string;

  storeName: string;
  logoUrl: string;

  contactNumber: string;
  email: string;
  address: string;

  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;

  footerText: string;

  seoTitle: string;
  seoDescription: string;

  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}

interface SettingsApiResponse {
  success?: boolean;
  settings?: WebsiteSettingsData;
  message?: string;
  error?: string;
}

interface UploadApiResponse {
  success?: boolean;
  url?: string;
  message?: string;
  error?: string;
}

const defaultSettings: WebsiteSettingsData = {
  storeName: "DianaKart",
  logoUrl: "/logo.png",

  contactNumber: "",
  email: "",
  address: "",

  instagramUrl: "",
  facebookUrl: "",
  whatsappNumber: "",

  footerText: "© DianaKart. All rights reserved.",

  seoTitle: "DianaKart - Women Fashion Store",

  seoDescription:
    "Shop dresses, handbags, footwear, jewellery and beauty products at DianaKart.",

  isActive: true,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export default function WebsiteSettingsPage() {
  const [form, setForm] =
    useState<WebsiteSettingsData>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadSettings = async (
    showRefreshLoader = false
  ) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const data: SettingsApiResponse =
        await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load website settings"
        );
      }

      if (data.settings) {
        setForm({
          ...defaultSettings,
          ...data.settings,
        });
      }
    } catch (loadError) {
      console.error(
        "Load website settings error:",
        loadError
      );

      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleLogoUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setLogoUploading(true);
      setError("");
      setSuccessMessage("");

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Only JPG, PNG and WEBP images are allowed."
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "Logo image must be smaller than 5MB."
        );
      }

      const formData = new FormData();

      formData.append("file", file);
      formData.append("folder", "products");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.url
      ) {
        throw new Error(
          data.error ||
            data.message ||
            "Logo upload failed"
        );
      }

      setForm((currentForm) => ({
        ...currentForm,
        logoUrl: data.url || "/logo.png",
      }));

      setSuccessMessage(
        "Logo uploaded successfully. Click Save Settings to apply it."
      );
    } catch (uploadError) {
      console.error(
        "Logo upload error:",
        uploadError
      );

      setError(getErrorMessage(uploadError));
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (!form.storeName.trim()) {
        throw new Error(
          "Store name is required."
        );
      }

      if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        throw new Error(
          "Please enter a valid email address."
        );
      }

      const payload = {
        storeName:
          form.storeName.trim() || "DianaKart",

        logoUrl:
          form.logoUrl.trim() || "/logo.png",

        contactNumber:
          form.contactNumber.trim(),

        email: form.email.trim(),

        address: form.address.trim(),

        instagramUrl:
          form.instagramUrl.trim(),

        facebookUrl:
          form.facebookUrl.trim(),

        whatsappNumber:
          form.whatsappNumber.trim(),

        footerText:
          form.footerText.trim() ||
          "© DianaKart. All rights reserved.",

        seoTitle:
          form.seoTitle.trim() ||
          "DianaKart - Women Fashion Store",

        seoDescription:
          form.seoDescription.trim() ||
          "Shop dresses, handbags, footwear, jewellery and beauty products at DianaKart.",

        isActive: form.isActive,
      };

      const response = await fetch(
        "/api/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data: SettingsApiResponse =
        await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to save website settings"
        );
      }

      if (data.settings) {
        setForm({
          ...defaultSettings,
          ...data.settings,
        });
      }

      setSuccessMessage(
        "Website settings saved successfully."
      );
    } catch (saveError) {
      console.error(
        "Save website settings error:",
        saveError
      );

      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={46}
            className="mx-auto animate-spin text-pink-600"
          />

          <p className="mt-4 font-medium text-gray-600">
            Loading website settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header */}

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Website Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Manage store information, contact details,
            social links and SEO settings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSettings(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={18}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Error Message */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 transition hover:bg-red-100"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Success Message */}

      {successMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Success
            </p>

            <p className="mt-1 text-sm">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            className="rounded-lg p-1 transition hover:bg-green-100"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-7 xl:grid-cols-[1fr_360px]">
          {/* Main Settings */}

          <div className="space-y-7">
            {/* General Settings */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 p-5 md:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                  <Store size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    General Settings
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Store name, logo and website status.
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-5 md:p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Store Name *
                  </label>

                  <input
                    type="text"
                    name="storeName"
                    value={form.storeName}
                    onChange={handleInputChange}
                    placeholder="DianaKart"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Logo URL
                  </label>

                  <input
                    type="text"
                    name="logoUrl"
                    value={form.logoUrl}
                    onChange={handleInputChange}
                    placeholder="/logo.png"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="font-bold text-gray-900">
                        Website Status
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Disable this setting to mark the
                        website as inactive.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          isActive:
                            !currentForm.isActive,
                        }))
                      }
                      className={`relative h-7 w-14 shrink-0 rounded-full transition ${
                        form.isActive
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                      aria-label="Toggle website status"
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                          form.isActive
                            ? "left-8"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      form.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {form.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
            </section>

            {/* Contact Settings */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 p-5 md:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Phone size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Contact Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Store phone, email and address.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Contact Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="support@dianakart.com"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Store Address
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-4 top-4 text-gray-400"
                    />

                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Enter complete store address"
                      className="w-full resize-none rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Social Media */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 p-5 md:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Globe2 size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Social Media
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Add social profile links and WhatsApp
                    number.
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 md:p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Instagram URL
                  </label>

                  <div className="relative">
                    <Globe2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500"
/>

                    <input
                      type="text"
                      name="instagramUrl"
                      value={form.instagramUrl}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/dianakart"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Facebook URL
                  </label>

                  <div className="relative">
                    <Facebook
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
                    />

                    <input
                      type="text"
                      name="facebookUrl"
                      value={form.facebookUrl}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/dianakart"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    WhatsApp Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600"
                    />

                    <input
                      type="text"
                      name="whatsappNumber"
                      value={form.whatsappNumber}
                      onChange={handleInputChange}
                      placeholder="919876543210"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Enter country code without spaces or
                    symbols. Example: 919876543210
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 p-5 md:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Settings size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Footer Settings
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Configure website footer copyright text.
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Footer Text
                </label>

                <textarea
                  name="footerText"
                  value={form.footerText}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="© DianaKart. All rights reserved."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
            </section>

            {/* SEO */}

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 p-5 md:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Search size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    SEO Settings
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Search engine title and description.
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 md:p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    SEO Title
                  </label>

                  <input
                    type="text"
                    name="seoTitle"
                    value={form.seoTitle}
                    onChange={handleInputChange}
                    maxLength={70}
                    placeholder="DianaKart - Women Fashion Store"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />

                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-gray-500">
                      {form.seoTitle.length}/70
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    SEO Description
                  </label>

                  <textarea
                    name="seoDescription"
                    value={form.seoDescription}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={170}
                    placeholder="Shop dresses, handbags, footwear, jewellery and beauty products at DianaKart."
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />

                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-gray-500">
                      {form.seoDescription.length}/170
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}

          <aside className="space-y-6">
            {/* Logo Preview */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Logo Preview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current website logo.
              </p>

              <div className="mt-5 flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-5">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt={form.storeName || "Store Logo"}
                    className="max-h-24 max-w-full object-contain"
                  />
                ) : (
                  <Store
                    size={46}
                    className="text-gray-300"
                  />
                )}
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-200">
                {logoUploading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={18} />
                )}

                {logoUploading
                  ? "Uploading..."
                  : "Upload New Logo"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="hidden"
                />
              </label>

              {form.logoUrl !== "/logo.png" && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      logoUrl: "/logo.png",
                    }))
                  }
                  className="mt-3 w-full rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Use Default Logo
                </button>
              )}
            </section>

            {/* Website Preview */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Store Preview
              </h2>

              <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 bg-white p-4">
                  <img
                    src={form.logoUrl || "/logo.png"}
                    alt={form.storeName}
                    className="h-10 w-16 object-contain"
                  />

                  <p className="truncate text-lg font-bold text-blue-900">
                    {form.storeName || "DianaKart"}
                  </p>
                </div>

                <div className="bg-blue-900 px-4 py-3 text-sm text-white">
                  Women &nbsp; Beauty &nbsp; Footwear
                </div>

                <div className="bg-gray-50 p-5">
                  <p className="font-bold text-gray-900">
                    {form.seoTitle ||
                      "DianaKart - Women Fashion Store"}
                  </p>

                  <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                    {form.seoDescription ||
                      "Shop women fashion products at DianaKart."}
                  </p>
                </div>
              </div>
            </section>

            {/* Save Button */}

            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-bold text-gray-900">
                Save Changes
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Save all website settings to MongoDB.
              </p>

              <button
                type="submit"
                disabled={
                  saving || logoUploading
                }
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}