"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

/* ========================================
   TYPES
======================================== */

interface Product {
  _id: string;
  name: string;
  brand?: string;
  category?: string;

  sellingPrice: number;

  oldPrice?: number;
  mrp?: number;

  stock: number;

  image?: string;
  images?: string[];

  description?: string;
  status?: string;
}

interface ProductApiResponse {
  product?: Product;
  error?: string;
}

const FALLBACK_IMAGE =
  "/products/placeholder.jpg";

/* ========================================
   PRODUCT DETAILS PAGE
======================================== */

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId =
    params.id as string;

  const { addToCart } =
    useCart();

  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null
    );

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState("");

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    addingToCart,
    setAddingToCart,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  /* ========================================
     LOAD PRODUCT
  ======================================== */

  useEffect(() => {
    const loadProduct =
      async () => {
        try {
          setLoading(true);
          setMessage("");

          const response =
            await fetch(
              `/api/products/${productId}`,
              {
                cache:
                  "no-store",
              }
            );

          const data:
            | ProductApiResponse
            | Product =
            await response.json();

          if (
            !response.ok
          ) {
            const errorMessage =
              "error" in
                data &&
              data.error
                ? data.error
                : "Product could not be loaded";

            throw new Error(
              errorMessage
            );
          }

          const productData =
            "product" in
              data &&
            data.product
              ? data.product
              : (data as Product);

          setProduct(
            productData
          );

          const images =
            getProductImages(
              productData
            );

          setSelectedImage(
            images[0]
          );

          setQuantity(1);
        } catch (
          error
        ) {
          console.error(
            "Product details load error:",
            error
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : "Product could not be loaded"
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    if (productId) {
      void loadProduct();
    }
  }, [productId]);

  /* ========================================
     PRODUCT IMAGES
  ======================================== */

  const productImages =
    useMemo(() => {
      return product
        ? getProductImages(
            product
          )
        : [];
    }, [product]);

  /* ========================================
     PRICE
  ======================================== */

  const displayPrice =
    Number(
      product?.sellingPrice ||
        0
    );

  const originalPrice =
    Number(
      product?.mrp ||
        product?.oldPrice ||
        0
    );

  const discountPercentage =
    originalPrice >
      displayPrice &&
    originalPrice > 0
      ? Math.round(
          ((originalPrice -
            displayPrice) /
            originalPrice) *
            100
        )
      : 0;

  /* ========================================
     STOCK
  ======================================== */

  const isOutOfStock =
    !product ||
    Number(
      product.stock
    ) <= 0;

  const maxQuantity =
    Math.max(
      1,
      Math.min(
        Number(
          product?.stock ||
            1
        ),
        10
      )
    );

  /* ========================================
     QUANTITY
  ======================================== */

  const decreaseQuantity =
    () => {
      setQuantity(
        (
          previousQuantity
        ) =>
          Math.max(
            1,
            previousQuantity -
              1
          )
      );
    };

  const increaseQuantity =
    () => {
      setQuantity(
        (
          previousQuantity
        ) =>
          Math.min(
            maxQuantity,
            previousQuantity +
              1
          )
      );
    };

  /* ========================================
     ADD TO CART / BUY NOW
  ======================================== */

  const handleAddToCart =
    async (
      redirectToCart =
        false
    ) => {
      if (
        !product ||
        isOutOfStock
      ) {
        return;
      }

      try {
        setAddingToCart(
          true
        );

        setMessage("");

        const cartProduct = {
          id: product._id,

          _id: product._id,

          name:
            product.name,

          price:
            displayPrice,

          sellingPrice:
            displayPrice,

          image:
            selectedImage ||
            productImages[0],

          quantity: 1,

          stock:
            product.stock,
        };

        for (
          let count = 0;
          count <
          quantity;
          count += 1
        ) {
          addToCart(
            cartProduct as never
          );
        }

        if (
          redirectToCart
        ) {
          router.push(
            "/cart"
          );

          return;
        }

        setMessage(
          `${quantity} item${
            quantity > 1
              ? "s"
              : ""
          } added to cart successfully.`
        );
      } catch (
        error
      ) {
        console.error(
          "Add to cart error:",
          error
        );

        setMessage(
          "Unable to add this product to the cart."
        );
      } finally {
        setAddingToCart(
          false
        );
      }
    };

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid animate-pulse gap-10 rounded-3xl bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
            <div className="aspect-square rounded-2xl bg-gray-200" />

            <div className="space-y-5">
              <div className="h-5 w-32 rounded bg-gray-200" />

              <div className="h-10 w-4/5 rounded bg-gray-200" />

              <div className="h-12 w-52 rounded bg-gray-200" />

              <div className="h-8 w-32 rounded bg-gray-200" />

              <div className="h-16 rounded bg-gray-200" />

              <div className="h-14 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ========================================
     PRODUCT NOT FOUND
  ======================================== */

  if (
    !product ||
    message.startsWith(
      "Product"
    )
  ) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-6xl">
            📦
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Product not
            found
          </h1>

          <p className="mt-3 text-gray-600">
            {message ||
              "This product is currently unavailable."}
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
          >
            <ArrowLeft
              size={19}
            />

            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  /* ========================================
     MAIN PAGE
  ======================================== */

  return (
    <main className="min-h-screen bg-gray-50">

      {/* BREADCRUMB */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-4 text-sm text-gray-500 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="whitespace-nowrap transition hover:text-pink-600"
          >
            Home
          </Link>

          <ChevronRight
            size={16}
            className="shrink-0"
          />

          <Link
            href="/products"
            className="whitespace-nowrap transition hover:text-pink-600"
          >
            Products
          </Link>

          {product.category && (
            <>
              <ChevronRight
                size={16}
                className="shrink-0"
              />

              <span className="whitespace-nowrap">
                {
                  product.category
                }
              </span>
            </>
          )}

          <ChevronRight
            size={16}
            className="shrink-0"
          />

          <span className="max-w-[240px] truncate font-medium text-gray-800">
            {product.name}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* MESSAGE */}

        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 font-medium ${
              message
                .toLowerCase()
                .includes(
                  "success"
                )
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* PRODUCT */}

        <div className="grid gap-8 rounded-3xl bg-white p-5 shadow-sm md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">

          {/* PRODUCT IMAGES */}

          <section className="min-w-0">
            <div className="flex flex-col-reverse gap-4 sm:flex-row">

              {/* THUMBNAILS */}

              <div className="flex gap-3 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
                {productImages.map(
                  (
                    imageUrl,
                    index
                  ) => {
                    const isSelected =
                      selectedImage ===
                      imageUrl;

                    return (
                      <button
                        key={`${imageUrl}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            imageUrl
                          )
                        }
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition ${
                          isSelected
                            ? "border-pink-600 ring-2 ring-pink-100"
                            : "border-gray-200 hover:border-pink-300"
                        }`}
                        aria-label={`View product image ${
                          index +
                          1
                        }`}
                      >
                        <Image
                          src={
                            imageUrl
                          }
                          alt={`${product.name} image ${
                            index +
                            1
                          }`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    );
                  }
                )}
              </div>

              {/* MAIN IMAGE */}

              <div className="group relative aspect-square min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <Image
                  src={
                    selectedImage ||
                    productImages[0]
                  }
                  alt={
                    product.name
                  }
                  fill
                  priority
                  unoptimized
                  className="object-contain p-4 transition duration-500 group-hover:scale-110"
                />

                {discountPercentage >
                  0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-pink-600 px-4 py-2 text-sm font-bold text-white shadow">
                    {
                      discountPercentage
                    }
                    % OFF
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              Hover over the
              image to zoom
            </p>
          </section>

          {/* PRODUCT INFORMATION */}

          <section className="min-w-0">

            {/* BRAND */}

            {product.brand && (
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-pink-600">
                {
                  product.brand
                }
              </p>
            )}

            {/* NAME */}

            <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
              {product.name}
            </h1>

            {/* CATEGORY */}

            {product.category && (
              <p className="mt-3 text-sm font-medium text-gray-500">
                Category:{" "}
                <span className="text-gray-700">
                  {
                    product.category
                  }
                </span>
              </p>
            )}

            {/* PRICE */}

            <div className="my-6 border-y border-gray-100 py-6">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-4xl font-extrabold text-gray-900">
                  ₹
                  {displayPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                {originalPrice >
                  displayPrice && (
                  <span className="pb-1 text-lg text-gray-400 line-through">
                    ₹
                    {originalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                )}

                {discountPercentage >
                  0 && (
                  <span className="pb-1 font-bold text-green-600">
                    Save{" "}
                    {
                      discountPercentage
                    }
                    %
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Inclusive of all
                taxes
              </p>
            </div>

            {/* STOCK */}

            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                isOutOfStock
                  ? "bg-red-100 text-red-700"
                  : product.stock <=
                      5
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOutOfStock
                    ? "bg-red-500"
                    : product.stock <=
                        5
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
              />

              {isOutOfStock
                ? "Out of Stock"
                : product.stock <=
                    5
                ? `Only ${product.stock} left`
                : "In Stock"}
            </div>

            {/* QUANTITY */}

            {!isOutOfStock && (
              <div className="mt-7">
                <p className="mb-3 font-semibold text-gray-800">
                  Quantity
                </p>

                <div className="inline-flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white">

                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      quantity <=
                      1
                    }
                    className="flex h-12 w-12 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus
                      size={
                        18
                      }
                    />
                  </button>

                  <span className="flex h-12 min-w-14 items-center justify-center border-x border-gray-300 px-4 font-bold text-gray-900">
                    {
                      quantity
                    }
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      quantity >=
                      maxQuantity
                    }
                    className="flex h-12 w-12 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus
                      size={
                        18
                      }
                    />
                  </button>
                </div>

                {product.stock >
                  10 && (
                  <p className="mt-2 text-xs text-gray-400">
                    Maximum 10
                    items per
                    order
                  </p>
                )}
              </div>
            )}

            {/* BUTTONS */}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  handleAddToCart(
                    false
                  )
                }
                disabled={
                  isOutOfStock ||
                  addingToCart
                }
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-pink-600 px-5 font-bold text-pink-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
              >
                <ShoppingCart
                  size={21}
                />

                {addingToCart
                  ? "Adding..."
                  : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAddToCart(
                    true
                  )
                }
                disabled={
                  isOutOfStock ||
                  addingToCart
                }
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 font-bold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <ShoppingBag
                  size={21}
                />

                Buy Now
              </button>
            </div>

            {/* FEATURES */}

            <div className="mt-8 grid gap-3">
              <FeatureRow
                icon={
                  <Truck
                    size={
                      21
                    }
                  />
                }
                title="Fast Delivery"
                description="Delivery details will be shown at checkout."
              />

              <FeatureRow
                icon={
                  <RefreshCcw
                    size={
                      21
                    }
                  />
                }
                title="Easy Returns"
                description="Simple return support on eligible products."
              />

              <FeatureRow
                icon={
                  <ShieldCheck
                    size={
                      21
                    }
                  />
                }
                title="Secure Shopping"
                description="Your order information stays protected."
              />
            </div>
          </section>
        </div>

        {/* DESCRIPTION */}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Product
            Description
          </h2>

          <div className="mt-5 h-1 w-16 rounded-full bg-pink-600" />

          <p className="mt-6 whitespace-pre-line leading-8 text-gray-600">
            {product.description?.trim() ||
              "Product description will be added soon."}
          </p>
        </section>

        {/* PRODUCT HIGHLIGHTS */}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Product
            Highlights
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Highlight
              label="Brand"
              value={
                product.brand ||
                "DianaKart"
              }
            />

            <Highlight
              label="Category"
              value={
                product.category ||
                "Fashion"
              }
            />

            <Highlight
              label="Availability"
              value={
                isOutOfStock
                  ? "Out of Stock"
                  : "Available"
              }
            />

            <Highlight
              label="Images"
              value={`${
                productImages.length
              } Product Image${
                productImages.length >
                1
                  ? "s"
                  : ""
              }`}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/* ========================================
   GET PRODUCT IMAGES
======================================== */

function getProductImages(
  product: Product
): string[] {
  const images =
    Array.isArray(
      product.images
    )
      ? product.images.filter(
          (
            image
          ): image is string =>
            typeof image ===
              "string" &&
            image.trim()
              .length > 0
        )
      : [];

  if (
    product.image &&
    typeof product.image ===
      "string" &&
    !images.includes(
      product.image
    )
  ) {
    images.unshift(
      product.image
    );
  }

  const uniqueImages =
    Array.from(
      new Set(images)
    );

  return uniqueImages.length >
    0
    ? uniqueImages
    : [FALLBACK_IMAGE];
}

/* ========================================
   FEATURE ROW
======================================== */

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
        {icon}
      </div>

      <div>
        <h3 className="font-bold text-gray-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ========================================
   HIGHLIGHT
======================================== */

function Highlight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}