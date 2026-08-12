"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BannerForm {
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: string;
  isActive: boolean;
}

interface BannersApiResponse {
  success?: boolean;
  banners?: Banner[];
  banner?: Banner;
  message?: string;
  error?: string;
}

interface UploadApiResponse {
  success?: boolean;
  url?: string;
  message?: string;
  error?: string;
}

const initialForm: BannerForm = {
  title: "",
  subtitle: "",
  desktopImage: "",
  mobileImage: "",
  buttonText: "Shop Now",
  buttonLink: "/products",
  displayOrder: "0",
  isActive: true,
};

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export default function BannerManagementPage() {
  const [banners, setBanners] = useState<Banner[]>([]);

  const [form, setForm] = useState<BannerForm>(initialForm);

  const [editingBannerId, setEditingBannerId] = useState<string | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [desktopUploading, setDesktopUploading] = useState(false);
  const [mobileUploading, setMobileUploading] = useState(false);

  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(
    null
  );

  const [togglingBannerId, setTogglingBannerId] = useState<string | null>(
    null
  );

  const [showForm, setShowForm] = useState(false);
  const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchBanners = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/banners", {
        cache: "no-store",
      });

      const data: BannersApiResponse = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Failed to load banners"
        );
      }

      setBanners(Array.isArray(data.banners) ? data.banners : []);
    } catch (fetchError) {
      console.error("Fetch banners error:", fetchError);
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!showForm && !deleteBanner) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm, deleteBanner]);

  const filteredBanners = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return banners;
    }

    return banners.filter((banner) => {
      const searchableText = [
        banner.title,
        banner.subtitle,
        banner.buttonText,
        banner.buttonLink,
        String(banner.displayOrder),
        banner.isActive ? "active" : "inactive",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [banners, searchTerm]);

  const statistics = useMemo(() => {
    const activeBanners = banners.filter(
      (banner) => banner.isActive
    ).length;

    return {
      total: banners.length,
      active: activeBanners,
      inactive: banners.length - activeBanners,
    };
  }, [banners]);

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingBannerId(null);
    setForm(initialForm);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const openEditForm = (banner: Banner) => {
    setEditingBannerId(banner._id);

    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      desktopImage: banner.desktopImage || "",
      mobileImage: banner.mobileImage || "",
      buttonText: banner.buttonText || "Shop Now",
      buttonLink: banner.buttonLink || "/products",
      displayOrder: String(banner.displayOrder ?? 0),
      isActive: Boolean(banner.isActive),
    });

    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving || desktopUploading || mobileUploading) {
      return;
    }

    setShowForm(false);
    setEditingBannerId(null);
    setForm(initialForm);
    setFormError("");
  };

  const uploadImage = async (
    file: File,
    imageType: "desktop" | "mobile"
  ) => {
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Only JPG, PNG and WEBP images are allowed.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be smaller than 5MB.");
      }

      if (imageType === "desktop") {
        setDesktopUploading(true);
      } else {
        setMobileUploading(true);
      }

      setFormError("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("folder", "banners");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadApiResponse = await response.json();

      if (!response.ok || !data.success || !data.url) {
        throw new Error(
          data.error || data.message || "Image upload failed"
        );
      }

      setForm((currentForm) => ({
        ...currentForm,
        [imageType === "desktop" ? "desktopImage" : "mobileImage"]:
          data.url || "",
      }));
    } catch (uploadError) {
      console.error("Banner upload error:", uploadError);
      setFormError(getErrorMessage(uploadError));
    } finally {
      if (imageType === "desktop") {
        setDesktopUploading(false);
      } else {
        setMobileUploading(false);
      }
    }
  };

  const handleDesktopImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    await uploadImage(file, "desktop");
  };

  const handleMobileImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    await uploadImage(file, "mobile");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setSuccessMessage("");

      if (!form.desktopImage.trim()) {
        throw new Error("Please upload a desktop banner image.");
      }

      const displayOrder = Number(form.displayOrder);

      if (
        Number.isNaN(displayOrder) ||
        displayOrder < 0 ||
        !Number.isInteger(displayOrder)
      ) {
        throw new Error(
          "Display order must be a positive whole number."
        );
      }

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        desktopImage: form.desktopImage.trim(),
        mobileImage: form.mobileImage.trim(),
        buttonText: form.buttonText.trim() || "Shop Now",
        buttonLink: form.buttonLink.trim() || "/",
        displayOrder,
        isActive: form.isActive,
      };

      const isEditing = Boolean(editingBannerId);

      const response = await fetch(
        isEditing
          ? `/api/banners/${editingBannerId}`
          : "/api/banners",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data: BannersApiResponse = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to ${isEditing ? "update" : "create"} banner`
        );
      }

      setSuccessMessage(
        isEditing
          ? "Banner updated successfully."
          : "Banner created successfully."
      );

      await fetchBanners();

      setTimeout(() => {
        setShowForm(false);
        setEditingBannerId(null);
        setForm(initialForm);
        setSuccessMessage("");
      }, 700);
    } catch (submitError) {
      console.error("Save banner error:", submitError);
      setFormError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      setTogglingBannerId(banner._id);
      setError("");

      const response = await fetch(`/api/banners/${banner._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !banner.isActive,
        }),
      });

      const data: BannersApiResponse = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Failed to update banner status"
        );
      }

      setBanners((currentBanners) =>
        currentBanners.map((currentBanner) =>
          currentBanner._id === banner._id
            ? {
                ...currentBanner,
                isActive: !currentBanner.isActive,
              }
            : currentBanner
        )
      );
    } catch (toggleError) {
      console.error("Toggle banner error:", toggleError);
      setError(getErrorMessage(toggleError));
    } finally {
      setTogglingBannerId(null);
    }
  };

  const confirmDeleteBanner = async () => {
    if (!deleteBanner) {
      return;
    }

    try {
      setDeletingBannerId(deleteBanner._id);
      setError("");

      const response = await fetch(
        `/api/banners/${deleteBanner._id}`,
        {
          method: "DELETE",
        }
      );

      const data: BannersApiResponse = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Failed to delete banner"
        );
      }

      setBanners((currentBanners) =>
        currentBanners.filter(
          (banner) => banner._id !== deleteBanner._id
        )
      );

      setDeleteBanner(null);
    } catch (deleteError) {
      console.error("Delete banner error:", deleteError);
      setError(getErrorMessage(deleteError));
    } finally {
      setDeletingBannerId(null);
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
            Loading banners...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl">
        {/* Header */}

        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Banner Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage homepage promotional and hero banners.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => fetchBanners(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-pink-700"
            >
              <Plus size={19} />
              Add Banner
            </button>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={21} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 text-sm">{error}</p>
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

        {/* Statistics */}

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Banners
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.total}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <ImageIcon size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Banners
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.active}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <Eye size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Inactive Banners
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.inactive}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <EyeOff size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Banner list */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Banner List
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredBanners.length} of {banners.length}{" "}
                  banners
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
                  placeholder="Search title, button or status..."
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
            </div>
          </div>

          {filteredBanners.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon
                size={54}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 text-lg font-bold text-gray-800">
                {searchTerm
                  ? "No matching banners found"
                  : "No banners available"}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {searchTerm
                  ? "Try a different search keyword."
                  : "Create your first homepage banner."}
              </p>

              {!searchTerm && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700"
                >
                  <Plus size={18} />
                  Add First Banner
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-950 text-left text-sm text-white">
                    <tr>
                      <th className="px-6 py-4">Banner</th>
                      <th className="px-6 py-4">Content</th>
                      <th className="px-6 py-4">Button</th>
                      <th className="px-6 py-4 text-center">Order</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredBanners.map((banner) => (
                      <tr
                        key={banner._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="h-20 w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            {banner.desktopImage ? (
                              <img
                                src={banner.desktopImage}
                                alt={banner.title || "Banner"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-400">
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="max-w-xs px-6 py-4">
                          <p className="truncate font-bold text-gray-900">
                            {banner.title || "Untitled Banner"}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {banner.subtitle || "No subtitle"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {banner.buttonText || "—"}
                          </p>

                          <p className="mt-1 max-w-40 truncate text-xs text-gray-500">
                            {banner.buttonLink || "—"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                            {banner.displayOrder}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(banner)
                            }
                            disabled={
                              togglingBannerId === banner._id
                            }
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              banner.isActive
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {togglingBannerId === banner._id ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : banner.isActive ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}

                            {banner.isActive
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(banner.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(banner)}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                            >
                              <Edit3 size={16} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteBanner(banner)}
                              className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}

              <div className="divide-y divide-gray-100 lg:hidden">
                {filteredBanners.map((banner) => (
                  <div key={banner._id} className="p-5">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      <div className="aspect-[16/7]">
                        <img
                          src={banner.desktopImage}
                          alt={banner.title || "Banner"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-gray-900">
                          {banner.title || "Untitled Banner"}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {banner.subtitle || "No subtitle"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                        Order {banner.displayOrder}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm">
                      <div>
                        <p className="text-gray-500">Button</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          {banner.buttonText || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Status</p>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(banner)}
                          disabled={
                            togglingBannerId === banner._id
                          }
                          className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            banner.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {togglingBannerId === banner._id ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : banner.isActive ? (
                            <Eye size={13} />
                          ) : (
                            <EyeOff size={13} />
                          )}

                          {banner.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(banner)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-200"
                      >
                        <Edit3 size={17} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteBanner(banner)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-200"
                      >
                        <Trash2 size={17} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={closeForm}
        >
          <div
            className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-gray-200 bg-white p-5 md:p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBannerId ? "Edit Banner" : "Add New Banner"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Upload images and configure homepage banner content.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-6">
              {formError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle
                    size={21}
                    className="mt-0.5 shrink-0"
                  />
                  <p>{formError}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                  <CheckCircle2 size={21} />
                  <p className="font-semibold">{successMessage}</p>
                </div>
              )}

              <div className="grid gap-7 xl:grid-cols-2">
                {/* Desktop image */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Desktop Banner Image *
                  </label>

                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    {form.desktopImage ? (
                      <div>
                        <div className="aspect-[16/6] bg-gray-100">
                          <img
                            src={form.desktopImage}
                            alt="Desktop banner preview"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3 border-t border-gray-200 bg-white p-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200">
                            {desktopUploading ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Upload size={17} />
                            )}

                            Replace Image

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleDesktopImageChange}
                              disabled={desktopUploading}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setForm((currentForm) => ({
                                ...currentForm,
                                desktopImage: "",
                              }))
                            }
                            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-gray-100">
                        {desktopUploading ? (
                          <Loader2
                            size={38}
                            className="animate-spin text-pink-600"
                          />
                        ) : (
                          <Upload
                            size={38}
                            className="text-gray-400"
                          />
                        )}

                        <p className="mt-4 font-bold text-gray-800">
                          {desktopUploading
                            ? "Uploading image..."
                            : "Upload Desktop Banner"}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          Recommended size: 1920 × 650 pixels
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          JPG, PNG or WEBP • Maximum 5MB
                        </p>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleDesktopImageChange}
                          disabled={desktopUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Mobile image */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Mobile Banner Image
                  </label>

                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    {form.mobileImage ? (
                      <div>
                        <div className="mx-auto aspect-[4/5] max-h-72 bg-gray-100">
                          <img
                            src={form.mobileImage}
                            alt="Mobile banner preview"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3 border-t border-gray-200 bg-white p-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200">
                            {mobileUploading ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Upload size={17} />
                            )}

                            Replace Image

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleMobileImageChange}
                              disabled={mobileUploading}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setForm((currentForm) => ({
                                ...currentForm,
                                mobileImage: "",
                              }))
                            }
                            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-gray-100">
                        {mobileUploading ? (
                          <Loader2
                            size={38}
                            className="animate-spin text-pink-600"
                          />
                        ) : (
                          <Upload
                            size={38}
                            className="text-gray-400"
                          />
                        )}

                        <p className="mt-4 font-bold text-gray-800">
                          {mobileUploading
                            ? "Uploading image..."
                            : "Upload Mobile Banner"}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          Recommended size: 800 × 1000 pixels
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Optional • Desktop image used as fallback
                        </p>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleMobileImageChange}
                          disabled={mobileUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Text fields */}

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Banner Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="Example: Summer Sale"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Button Text
                  </label>

                  <input
                    type="text"
                    name="buttonText"
                    value={form.buttonText}
                    onChange={handleInputChange}
                    placeholder="Shop Now"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Banner Subtitle
                  </label>

                  <textarea
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Example: Up to 50% off on selected products"
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Button Link
                  </label>

                  <input
                    type="text"
                    name="buttonLink"
                    value={form.buttonLink}
                    onChange={handleInputChange}
                    placeholder="/products"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Example: /products or /products/dresses
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Display Order
                  </label>

                  <input
                    type="number"
                    name="displayOrder"
                    min="0"
                    step="1"
                    value={form.displayOrder}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Lower number appears first.
                  </p>
                </div>
              </div>

              {/* Status */}

              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="font-bold text-gray-900">
                      Banner Status
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Active banners will appear on the website.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        isActive: !currentForm.isActive,
                      }))
                    }
                    className={`relative h-7 w-14 shrink-0 rounded-full transition ${
                      form.isActive ? "bg-green-500" : "bg-gray-300"
                    }`}
                    aria-label="Toggle banner status"
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        form.isActive ? "left-8" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <p
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    form.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {form.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              {/* Form actions */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={
                    saving ||
                    desktopUploading ||
                    mobileUploading
                  }
                  className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    desktopUploading ||
                    mobileUploading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-7 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving Banner...
                    </>
                  ) : editingBannerId ? (
                    <>
                      <Edit3 size={18} />
                      Update Banner
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Banner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}

      {deleteBanner && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={() => {
            if (!deletingBannerId) {
              setDeleteBanner(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={27} />
            </div>

            <h2 className="mt-5 text-center text-xl font-bold text-gray-900">
              Delete Banner?
            </h2>

            <p className="mt-3 text-center text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-bold text-gray-900">
                {deleteBanner.title || "this banner"}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteBanner(null)}
                disabled={Boolean(deletingBannerId)}
                className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteBanner}
                disabled={Boolean(deletingBannerId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingBannerId ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}