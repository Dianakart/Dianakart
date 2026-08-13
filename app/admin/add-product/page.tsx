"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
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
  image: string;
  images: string[];
  description: string;
  status: string;
}

const initialProduct: ProductForm = {
  name: "",
  sku: "",
  brand: "",
  category: "",
  supplier: "",
  costPrice: "",
  sellingPrice: "",
  image: "",
  images: [],
  description: "",
  status: "Active",
};

const MAX_PRODUCT_IMAGES = 5;

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

export default function AddProductPage() {
  const [product, setProduct] =
    useState<ProductForm>(initialProduct);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const imageInputRef =
    useRef<HTMLInputElement | null>(null);

  const pendingFilesRef = useRef<File[]>([]);

  // Categories load
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);

        const response = await fetch("/api/categories", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load categories"
          );
        }

        let categoryList: Category[] = [];

        if (Array.isArray(data)) {
          categoryList = data;
        } else if (Array.isArray(data.categories)) {
          categoryList = data.categories;
        }

        const activeCategories = categoryList.filter(
          (category) =>
            category.status?.toLowerCase() === "active"
        );

        setCategories(activeCategories);
      } catch (error) {
        console.error("Category load error:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setProduct((previousProduct) => ({
      ...previousProduct,
      [name]: value,
    }));
  };

  const openNextImageForCropping = () => {
    const nextFile = pendingFilesRef.current.shift();

    if (!nextFile) {
      setCropperOpen(false);
      setOriginalImageUrl("");

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setMessage("❌ Unable to load selected image");
        setCropperOpen(false);
        return;
      }

      setOriginalImageUrl(result);
      setCropperOpen(true);
    };

    reader.onerror = () => {
      setMessage("❌ Unable to read selected image");
      setCropperOpen(false);
    };

    reader.readAsDataURL(nextFile);
  };

  // Select one or more images and crop them one by one
  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    setMessage("");

    if (selectedFiles.length === 0) {
      return;
    }

    const availableSlots =
      MAX_PRODUCT_IMAGES - galleryFiles.length;

    if (availableSlots <= 0) {
      setMessage(
        `❌ You can upload a maximum of ${MAX_PRODUCT_IMAGES} images`
      );
      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const invalidTypeFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidTypeFile) {
      setMessage(
        "❌ Only JPG, PNG and WEBP images are allowed"
      );
      event.target.value = "";
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    const oversizedFile = selectedFiles.find(
      (file) => file.size > maximumSize
    );

    if (oversizedFile) {
      setMessage(
        "❌ Each image must be less than 5MB"
      );
      event.target.value = "";
      return;
    }

    // Keep only the number of files that can fit in the 5-image limit.
    const filesToCrop = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      setMessage(
        `⚠️ Only the first ${availableSlots} image${
          availableSlots === 1 ? "" : "s"
        } will be added. Maximum limit is ${MAX_PRODUCT_IMAGES}.`
      );
    }

    pendingFilesRef.current = filesToCrop;
    event.target.value = "";

    openNextImageForCropping();
  };

  // Add the cropped image and automatically open the next image
  const handleCropDone = (
    croppedFile: File,
    croppedPreviewUrl: string
  ) => {
    const nextCount = galleryFiles.length + 1;

    if (galleryFiles.length >= MAX_PRODUCT_IMAGES) {
      pendingFilesRef.current = [];
      URL.revokeObjectURL(croppedPreviewUrl);
      setMessage(
        `❌ You can upload a maximum of ${MAX_PRODUCT_IMAGES} images`
      );
    } else {
      setGalleryFiles((previousFiles) =>
        previousFiles.length >= MAX_PRODUCT_IMAGES
          ? previousFiles
          : [...previousFiles, croppedFile]
      );

      setGalleryImages((previousImages) =>
        previousImages.length >= MAX_PRODUCT_IMAGES
          ? previousImages
          : [...previousImages, croppedPreviewUrl]
      );

      if (nextCount >= MAX_PRODUCT_IMAGES) {
        pendingFilesRef.current = [];
      }
    }

    if (originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }

    setOriginalImageUrl("");
    setCropperOpen(false);

    if (nextCount < MAX_PRODUCT_IMAGES) {
      window.setTimeout(() => {
        openNextImageForCropping();
      }, 0);
    } else if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleCropCancel = () => {
    if (originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }

    setOriginalImageUrl("");
    setCropperOpen(false);

    window.setTimeout(() => {
      openNextImageForCropping();
    }, 0);
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

  const uploadProductImages = async (): Promise<string[]> => {
    if (galleryFiles.length === 0) {
      throw new Error("Please select at least one product image");
    }

    const uploadedUrls = await Promise.all(
      galleryFiles
        .slice(0, MAX_PRODUCT_IMAGES)
        .map(async (file) => {
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
      })
    );

    return uploadedUrls;
  };

  const profit =
    Number(product.sellingPrice || 0) -
    Number(product.costPrice || 0);

  const profitPercentage =
    Number(product.costPrice) > 0
      ? (profit / Number(product.costPrice)) * 100
      : 0;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (galleryFiles.length === 0) {
        throw new Error("Please select at least one product image");
      }

      if (
        Number(product.sellingPrice) <
        Number(product.costPrice)
      ) {
        throw new Error(
          "Selling price cannot be lower than cost price"
        );
      }

      const uploadedImageUrls = await uploadProductImages();

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          image: uploadedImageUrls[0],
          images: uploadedImageUrls,
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
        throw new Error(data.error || "Failed to save product");
      }

      galleryImages.forEach((previewUrl) => {
        if (previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      if (originalImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(originalImageUrl);
      }

      setProduct(initialProduct);
      setGalleryFiles([]);
      setGalleryImages([]);
      setSelectedSizes([]);
      pendingFilesRef.current = [];
      setOriginalImageUrl("");
      setCropperOpen(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      setMessage("✅ Product and images saved successfully");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Product save error:", error);

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Add Product
            </h1>

            <p className="mt-2 text-gray-600">
              Add a new product to DianaKart.
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

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Basic Information */}
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Basic Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the basic product details.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Product Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    required
                    placeholder="Example: Floral Summer Dress"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Product Code / SKU
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    required
                    placeholder="Example: DK-DRESS-001"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase text-gray-900 outline-none placeholder:normal-case placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                    placeholder="Example: Diana Fashion"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Category
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    required
                    disabled={categoriesLoading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {!categoriesLoading &&
                    categories.length === 0 && (
                      <p className="mt-2 text-sm text-red-600">
                        No active category found. Add a category from the Categories page first.
                      </p>
                    )}
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
                    placeholder="Supplier name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                    <option value="Active">
                      Active — Visible on website
                    </option>

                    <option value="Inactive">
                      Inactive — Hidden from website
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Pricing
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set the cost price and selling price.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Cost Price
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      name="costPrice"
                      value={product.costPrice}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-9 pr-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-800">
                    Selling Price
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      name="sellingPrice"
                      value={product.sellingPrice}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-9 pr-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
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
                  <p className="text-sm font-medium text-gray-600">
                    Profit Per Product
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      profit >= 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    ₹{profit.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm font-medium text-gray-600">
                    Profit Percentage
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-700">
                    {profitPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Available Sizes */}
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

            {/* Product Images */}
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Product Images
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Upload up to 5 product images. The first image
                  will be used as the main image.
                </p>
              </div>

              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">
                {galleryImages.length < MAX_PRODUCT_IMAGES && (
                  <div className="mb-6 text-center">
                    <div className="mb-3 text-5xl">📷</div>

                    <p className="text-lg font-semibold text-gray-800">
                      Add Product Image
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      JPG, PNG or WEBP — maximum 5MB per image
                    </p>

                    <label className="mt-5 inline-block cursor-pointer rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700">
                      Choose Image

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
                      {galleryImages.length} of {MAX_PRODUCT_IMAGES} images added
                    </p>
                  </div>
                )}

                {galleryImages.length === 0 ? (
                  <div className="rounded-lg bg-white p-5 text-center text-gray-500">
                    No images added yet
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
                                className="rounded-lg border border-pink-300 px-3 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50"
                              >
                                Set as Main
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {galleryImages.length >= MAX_PRODUCT_IMAGES && (
                  <div className="mt-5 rounded-lg bg-green-50 p-4 text-center font-semibold text-green-700">
                    Maximum {MAX_PRODUCT_IMAGES} images added
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Product Description
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the product features and details.
                </p>
              </div>

              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                rows={7}
                placeholder="Product description, material, size, color and care instructions..."
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  galleryImages.forEach((previewUrl) => {
                    if (previewUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(previewUrl);
                    }
                  });

                  setProduct(initialProduct);
                  setGalleryFiles([]);
                  setGalleryImages([]);
                  setSelectedSizes([]);
                  pendingFilesRef.current = [];
                  setOriginalImageUrl("");
                  setCropperOpen(false);
                  setMessage("");

                  if (imageInputRef.current) {
                    imageInputRef.current.value = "";
                  }
                }}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset Form
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  categoriesLoading ||
                  categories.length === 0
                }
                className="rounded-lg bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Saving Product..."
                  : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {cropperOpen && originalImageUrl && (
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