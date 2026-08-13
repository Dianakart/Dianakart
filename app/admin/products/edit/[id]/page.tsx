"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import ImageCropper from "@/components/admin/ImageCropper";

interface Category {
  _id: string;
  name: string;
  status: string;
}

interface ProductForm {
  name: string;
  sku: string;
  brand: string;
  category: string;
  supplier: string;
  costPrice: string;
  sellingPrice: string;
  description: string;
  status: string;
}

interface ProductVariant {
  color?: string;
  sizes?: string[];
}

interface ProductResponse {
  name?: string;
  sku?: string;
  brand?: string;
  category?: string;
  supplier?: string;
  costPrice?: number | string;
  sellingPrice?: number | string;
  image?: string;
  images?: string[];
  variants?: ProductVariant[];
  description?: string;
  status?: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CLOTHING_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
] as const;

const WAIST_SIZES = [
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
] as const;

const initialProduct: ProductForm = {
  name: "",
  sku: "",
  brand: "",
  category: "",
  supplier: "",
  costPrice: "",
  sellingPrice: "",
  description: "",
  status: "Active",
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductForm>(initialProduct);
  const [categories, setCategories] = useState<Category[]>([]);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<Array<File | null>>([]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setPageLoading(true);
        setMessage("");

        const [productResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/products/${productId}`, { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        const rawProductData = await productResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (!productResponse.ok) {
          throw new Error(rawProductData.error || "Failed to load product");
        }

        const productData: ProductResponse =
          rawProductData.product && typeof rawProductData.product === "object"
            ? rawProductData.product
            : rawProductData;

        let categoryList: Category[] = [];

        if (Array.isArray(categoriesData)) {
          categoryList = categoriesData;
        } else if (Array.isArray(categoriesData.categories)) {
          categoryList = categoriesData.categories;
        }

        setCategories(
          categoryList.filter(
            (category) => category.status?.toLowerCase() === "active"
          )
        );

        setProduct({
          name: productData.name || "",
          sku: productData.sku || "",
          brand: productData.brand || "",
          category: productData.category || "",
          supplier: productData.supplier || "",
          costPrice: String(productData.costPrice ?? ""),
          sellingPrice: String(productData.sellingPrice ?? ""),
          description: productData.description || "",
          status: productData.status || "Active",
        });

        const loadedSizes = Array.isArray(productData.variants)
          ? Array.from(
              new Set(
                productData.variants.flatMap((variant) =>
                  Array.isArray(variant.sizes)
                    ? variant.sizes
                        .map((size) => String(size).trim())
                        .filter(Boolean)
                    : []
                )
              )
            )
          : [];

        setSelectedSizes(loadedSizes);

        const savedImages = Array.isArray(productData.images)
          ? productData.images.filter(
              (image): image is string =>
                typeof image === "string" && image.trim().length > 0
            )
          : [];

        if (
          productData.image &&
          typeof productData.image === "string" &&
          !savedImages.includes(productData.image)
        ) {
          savedImages.unshift(productData.image);
        }

        const uniqueImages = Array.from(new Set(savedImages)).slice(
          0,
          MAX_IMAGES
        );

        setGalleryImages(uniqueImages);
        setGalleryFiles(uniqueImages.map(() => null));
      } catch (error) {
        console.error("Edit page load error:", error);
        setMessage(
          error instanceof Error
            ? `❌ ${error.message}`
            : "❌ Failed to load product data"
        );
      } finally {
        setPageLoading(false);
      }
    };

    if (productId) {
      loadPageData();
    }
  }, [productId]);

  useEffect(() => {
    return () => {
      if (originalImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(originalImageUrl);
      }
    };
  }, [originalImageUrl]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setProduct((previousProduct) => ({
      ...previousProduct,
      [name]: value,
    }));
  };

  const openCropperForFile = (file: File) => {
    if (originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }

    const temporaryUrl = URL.createObjectURL(file);
    setCurrentCropFile(file);
    setOriginalImageUrl(temporaryUrl);
    setCropperOpen(true);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage("");

    const selectedFiles: File[] = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_IMAGES - galleryImages.length;

    if (remainingSlots <= 0) {
      setMessage("❌ You can upload a maximum of 5 images");
      return;
    }

    const validFiles: File[] = [];
    let invalidTypeFound = false;
    let oversizedFileFound = false;

    selectedFiles.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        invalidTypeFound = true;
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        oversizedFileFound = true;
        return;
      }

      validFiles.push(file);
    });

    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      if (invalidTypeFound) {
        setMessage("❌ Only JPG, PNG and WEBP images are allowed");
      } else if (oversizedFileFound) {
        setMessage("❌ Every image must be smaller than 5MB");
      }
      return;
    }

    const notices: string[] = [];

    if (validFiles.length > remainingSlots) {
      notices.push(`Only ${remainingSlots} more image(s) can be added`);
    }

    if (invalidTypeFound) {
      notices.push("Unsupported files were skipped");
    }

    if (oversizedFileFound) {
      notices.push("Files larger than 5MB were skipped");
    }

    if (notices.length > 0) {
      setMessage(`❌ ${notices.join(". ")}`);
    }

    const [firstFile, ...remainingFiles] = filesToAdd;
    setPendingFiles(remainingFiles);
    openCropperForFile(firstFile);
  };

  const handleCropDone = (
    croppedFile: File,
    croppedPreviewUrl: string
  ) => {
    setGalleryFiles((previousFiles) => [...previousFiles, croppedFile]);
    setGalleryImages((previousImages) => [
      ...previousImages,
      croppedPreviewUrl,
    ]);

    setCropperOpen(false);
    setCurrentCropFile(null);

    if (originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }

    setOriginalImageUrl("");

    if (pendingFiles.length > 0) {
      const [nextFile, ...remainingFiles] = pendingFiles;
      setPendingFiles(remainingFiles);

      window.setTimeout(() => {
        openCropperForFile(nextFile);
      }, 0);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setCurrentCropFile(null);
    setPendingFiles([]);

    if (originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }

    setOriginalImageUrl("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    const imageToRemove = galleryImages[index];

    if (imageToRemove?.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove);
    }

    setGalleryImages((previousImages) =>
      previousImages.filter((_, imageIndex) => imageIndex !== index)
    );

    setGalleryFiles((previousFiles) =>
      previousFiles.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const setMainImage = (index: number) => {
    if (index === 0) {
      return;
    }

    setGalleryImages((previousImages) => {
      const updatedImages = [...previousImages];
      const selectedPreview = updatedImages[index];
      updatedImages.splice(index, 1);
      updatedImages.unshift(selectedPreview);
      return updatedImages;
    });

    setGalleryFiles((previousFiles) => {
      const updatedFiles = [...previousFiles];
      const selectedFile = updatedFiles[index];
      updatedFiles.splice(index, 1);
      updatedFiles.unshift(selectedFile);
      return updatedFiles;
    });
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((currentSizes) =>
      currentSizes.includes(size)
        ? currentSizes.filter((currentSize) => currentSize !== size)
        : [...currentSizes, size]
    );
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload image");
    }

    if (!data.url) {
      throw new Error("Image URL was not received");
    }

    return String(data.url);
  };

  const prepareFinalImageUrls = async (): Promise<string[]> => {
    const finalUrls = await Promise.all(
      galleryImages.map(async (previewUrl, index) => {
        const file = galleryFiles[index];

        if (file) {
          return uploadImageFile(file);
        }

        return previewUrl;
      })
    );

    return finalUrls.filter(Boolean).slice(0, MAX_IMAGES);
  };

  const profit =
    Number(product.sellingPrice || 0) - Number(product.costPrice || 0);

  const profitPercentage =
    Number(product.costPrice) > 0
      ? (profit / Number(product.costPrice)) * 100
      : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (galleryImages.length === 0) {
        throw new Error("Please keep at least one product image");
      }

      if (Number(product.sellingPrice) < Number(product.costPrice)) {
        throw new Error("Selling price cannot be lower than cost price");
      }

      const finalImageUrls = await prepareFinalImageUrls();

      if (finalImageUrls.length === 0) {
        throw new Error("Please keep at least one product image");
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          image: finalImageUrls[0],
          images: finalImageUrls,
          variants:
            selectedSizes.length > 0
              ? [
                  {
                    color: "",
                    sizes: selectedSizes,
                  },
                ]
              : [],
          costPrice: Number(product.costPrice),
          sellingPrice: Number(product.sellingPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      galleryImages.forEach((previewUrl) => {
        if (previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      setGalleryImages(finalImageUrls);
      setGalleryFiles(finalImageUrls.map(() => null));
      setMessage("✅ Product and images updated successfully");

      window.setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 900);
    } catch (error) {
      console.error("Update product error:", error);
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600" />
          <p className="mt-4 font-medium text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-2 text-gray-600">
              Update product details and manage product images.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl border p-4 font-medium ${
                message.startsWith("✅")
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Basic Information
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Product Code / SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This code is visible only in the admin panel.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={product.brand}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={product.supplier}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The supplier will not be shown on the public website.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Product Status
                  </label>
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  >
                    <option value="Active">Active — Visible on website</option>
                    <option value="Inactive">Inactive — Hidden from website</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Pricing
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={product.costPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={product.sellingPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div
                  className={`rounded-xl border p-5 ${
                    profit >= 0
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="text-sm text-gray-600">Profit Per Product</p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      profit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    ₹{profit.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm text-gray-600">Profit Percentage</p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">
                    {profitPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>


            {/* AVAILABLE SIZES */}

            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Available Sizes
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select all sizes available for this product. You can use standard clothing sizes,
                  waist sizes, or both.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="mb-3 font-semibold text-gray-800">
                    Clothing Sizes
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {CLOTHING_SIZES.map((size) => {
                      const selected = selectedSizes.includes(size);

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`min-w-14 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
                            selected
                              ? "border-pink-600 bg-pink-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-pink-300 hover:text-pink-600"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-3 font-semibold text-gray-800">
                    Jeans / Bottom Waist Sizes
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {WAIST_SIZES.map((size) => {
                      const selected = selectedSizes.includes(size);

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`min-w-14 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
                            selected
                              ? "border-pink-600 bg-pink-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-pink-300 hover:text-pink-600"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-600">
                    Selected Sizes
                  </p>

                  <p className="mt-2 font-bold text-gray-900">
                    {selectedSizes.length > 0
                      ? selectedSizes.join(", ")
                      : "No size selected"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Product Images
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Keep, remove or add up to 5 images. The first image is the main image.
                </p>
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">
                {galleryImages.length < MAX_IMAGES && (
                  <div className="mb-6 text-center">
                    <div className="mb-3 text-5xl">📷</div>
                    <p className="text-lg font-semibold text-gray-800">
                      Add Product Images
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      JPG, PNG or WEBP — maximum 5MB per image
                    </p>

                    <label className="mt-5 inline-block cursor-pointer rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700">
                      Choose Images
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      {galleryImages.length} of {MAX_IMAGES} images added
                    </p>
                  </div>
                )}

                {galleryImages.length === 0 ? (
                  <div className="rounded-lg bg-white p-5 text-center text-gray-500">
                    No images available
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryImages.map((preview, index) => (
                      <div
                        key={`${preview}-${index}`}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                      >
                        <div className="relative aspect-square w-full">
                          <Image
                            src={preview}
                            alt={`Product preview ${index + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />

                          {index === 0 && (
                            <div className="absolute left-3 top-3 rounded-full bg-pink-600 px-3 py-1 text-xs font-bold text-white shadow">
                              Main Image
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 p-4">
                          <p className="text-sm font-semibold text-gray-700">
                            Image {index + 1}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => setMainImage(index)}
                                disabled={saving}
                                className="rounded-lg border border-pink-300 px-3 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 disabled:opacity-50"
                              >
                                Set as Main
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              disabled={saving}
                              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {galleryImages.length >= MAX_IMAGES && (
                  <div className="mt-5 rounded-lg bg-green-50 p-4 text-center font-semibold text-green-700">
                    Maximum 5 images added
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Description
              </h2>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                rows={7}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || galleryImages.length === 0}
                className="rounded-lg bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Updating Product..." : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {cropperOpen && originalImageUrl && currentCropFile && (
        <ImageCropper
          key={originalImageUrl}
          imageUrl={originalImageUrl}
          onCancel={handleCropCancel}
          onCropDone={handleCropDone}
        />
      )}
    </>
  );
}