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
  Sparkles,
  Truck,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

/* ========================================
   TYPES
======================================== */

interface ProductVariant {
  color?: string;
  sizes?: string[];
}

interface Product {
  _id: string;
  name: string;
  brand?: string;
  category?: string;

  sellingPrice: number;

  oldPrice?: number;
  mrp?: number;


  image?: string;
  images?: string[];

  variants?: ProductVariant[];

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

  const { addToCart, totalItems } =
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
    selectedSize,
    setSelectedSize,
  ] =
    useState("");

  const [
    addedToCart,
    setAddedToCart,
  ] = 
    useState(false);

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

  const [
    showFullDescription,
    setShowFullDescription,
  ] =
    useState(false);

  const [
    similarProducts,
    setSimilarProducts,
  ] =
    useState<Product[]>([]);

  const [
    loadingSimilar,
    setLoadingSimilar,
  ] =
    useState(false);

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

          setSelectedSize("");
          setQuantity(1);
          setAddedToCart(false);
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
     LOAD SIMILAR PRODUCTS
  ======================================== */

  useEffect(() => {
    const loadSimilarProducts =
      async () => {
        if (
          !product?._id ||
          !product.category
        ) {
          setSimilarProducts([]);
          return;
        }

        try {
          setLoadingSimilar(true);

          const response =
            await fetch(
              "/api/products",
              {
                cache:
                  "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              "Similar products could not be loaded"
            );
          }

          const data =
            (await response.json()) as
              | Product[]
              | {
                  error?: string;
                };

          if (!Array.isArray(data)) {
            setSimilarProducts([]);
            return;
          }

          const currentCategory =
            product.category
              .trim()
              .toLowerCase();

          const relatedProducts =
            data
              .filter(
                (item) =>
                  item._id !==
                    product._id &&
                  item.category
                    ?.trim()
                    .toLowerCase() ===
                    currentCategory &&
                  item.status !==
                    "Inactive"
              )
              .slice(0, 6);

          setSimilarProducts(
            relatedProducts
          );
        } catch (error) {
          console.error(
            "Similar products load error:",
            error
          );

          setSimilarProducts([]);
        } finally {
          setLoadingSimilar(false);
        }
      };

    void loadSimilarProducts();
  }, [
    product?._id,
    product?.category,
  ]);

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
     AVAILABLE SIZES
  ======================================== */

  const availableSizes =
    useMemo(() => {
      if (
        !product ||
        !Array.isArray(
          product.variants
        )
      ) {
        return [];
      }

      const sizes =
        product.variants.flatMap(
          (variant) =>
            Array.isArray(
              variant.sizes
            )
              ? variant.sizes
              : []
        );

      return Array.from(
        new Set(
          sizes
            .map((size) =>
              String(
                size
              ).trim()
            )
            .filter(Boolean)
        )
      );
    }, [product]);

  const sizeRequired =
    availableSizes.length > 0;

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

  const maxQuantity = 10;

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
      if (!product) {
        return;
      }

      if (
        sizeRequired &&
        !selectedSize
      ) {
        setMessage(
          "Please select a size before continuing."
        );

        return;
      }

      try {
        setAddingToCart(
          true
        );

        setMessage("");

        const cartProduct = {
          id: product._id,

          name:
            product.name,

          price:
            displayPrice,

          image:
            selectedImage ||
            productImages[0],

          size:
            selectedSize ||
            undefined,
        };

        for (
          let count = 0;
          count <
          quantity;
          count += 1
        ) {
          addToCart(
            cartProduct
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

        setAddedToCart(true);

        setMessage(
          `${quantity} item${
            quantity > 1
              ? "s"
              : ""
          } added to cart successfully.${
            selectedSize
              ? ` Size: ${selectedSize}`
              : ""
          }`
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
            <div className="aspect-[2/3] rounded-2xl bg-gray-200" />

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

          {/* PRODUCT PAGE CART SHORTCUT */}

          <Link
            href="/cart"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 shadow-sm transition hover:border-pink-300 hover:text-pink-600"
          >
            <div className="relative">
              <ShoppingCart size={20} />

              {totalItems > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-[11px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </div>

            <span className="hidden sm:inline">
              Cart
            </span>
          </Link>
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
                : "border-orange-200 bg-orange-50 text-orange-700"
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

              <div className="group relative aspect-[2/3] w-full max-w-[430px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
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
                  sizes="(max-width: 768px) 100vw, 430px"
                  className="object-contain transition duration-500 group-hover:scale-105"
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

            {/* COMPACT SIMILAR PRODUCTS */}

            {(loadingSimilar ||
              similarProducts.length > 0) && (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink-600">
                      Similar Products
                    </p>

                    <h2 className="mt-0.5 text-base font-bold text-gray-900">
                      More Like This
                    </h2>
                  </div>

                  <Sparkles
                    size={18}
                    className="shrink-0 text-pink-600"
                  />
                </div>

                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {loadingSimilar ? (
                    Array.from({
                      length: 3,
                    }).map(
                      (
                        _item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="w-[105px] shrink-0 animate-pulse"
                        >
                          <div className="aspect-[2/3] rounded-xl bg-gray-200" />
                          <div className="mt-2 h-3 rounded bg-gray-200" />
                          <div className="mt-1.5 h-3 w-1/2 rounded bg-gray-200" />
                        </div>
                      )
                    )
                  ) : (
                    similarProducts.map(
                      (item) => {
                        const itemImage =
                          getProductImages(
                            item
                          )[0];

                        const itemSizes =
                          getAvailableSizes(
                            item
                          );

                        return (
                          <Link
                            key={item._id}
                            href={`/products/${item._id}`}
                            className="group w-[105px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-pink-300 hover:shadow-sm"
                          >
                            <div className="relative aspect-[2/3] overflow-hidden bg-gray-50">
                              <Image
                                src={
                                  itemImage
                                }
                                alt={
                                  item.name
                                }
                                fill
                                unoptimized
                                sizes="105px"
                                className="object-cover transition duration-300 group-hover:scale-105"
                              />
                            </div>

                            <div className="p-2">
                              <h3 className="line-clamp-2 text-[11px] font-bold leading-4 text-gray-900">
                                {item.name}
                              </h3>

                              <p className="mt-1 text-xs font-extrabold text-gray-900">
                                ₹
                                {Number(
                                  item.sellingPrice ||
                                    0
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                              {itemSizes.length >
                                0 && (
                                <p className="mt-1 truncate text-[10px] text-gray-500">
                                  {itemSizes.join(
                                    ", "
                                  )}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* PRODUCT INFORMATION */}

          <section className="min-w-0">

            {/* BRAND */}

            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-600">
                {
                  product.brand
                }
              </p>
            )}

            {/* NAME */}

            <h1 className="mt-2 text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
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

            <div className="my-5 border-y border-gray-100 py-5">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  ₹
                  {displayPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                {originalPrice >
                  displayPrice && (
                  <span className="pb-1 text-base text-gray-400 line-through">
                    ₹
                    {originalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                )}

                {discountPercentage >
                  0 && (
                  <span className="pb-1 text-sm font-bold text-green-600">
                    Save{" "}
                    {
                      discountPercentage
                    }
                    %
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Inclusive of all
                taxes
              </p>
            </div>

            {/* SIZE */}

            {availableSizes.length > 0 && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Select Size
                  </p>

                  {selectedSize && (
                    <span className="text-sm font-semibold text-pink-600">
                      Selected: {selectedSize}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {availableSizes.map(
                    (size) => {
                      const selected =
                        selectedSize ===
                        size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setSelectedSize(
                              size
                            );

                            if (
                              message ===
                              "Please select a size before continuing."
                            ) {
                              setMessage("");
                            }
                          }}
                          className={`min-w-12 rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                            selected
                              ? "border-pink-600 bg-pink-600 text-white"
                              : "border-gray-300 bg-white text-gray-800 hover:border-pink-400 hover:text-pink-600"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* QUANTITY */}

              <div className="mt-7">
                <p className="mb-2 text-sm font-semibold text-gray-800">
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
                    className="flex h-10 w-10 items-center justify-center text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus
                      size={
                        18
                      }
                    />
                  </button>

                  <span className="flex h-10 min-w-12 items-center justify-center border-x border-gray-300 px-3 text-sm font-bold text-gray-900">
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

                <p className="mt-2 text-xs text-gray-400">
                  Maximum 10 items per order
                </p>
              </div>

            {/* BUTTONS */}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              {addedToCart ? (
                <Link
                  href="/cart"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-pink-600 bg-pink-50 px-4 text-sm font-bold text-pink-600 transition hover:bg-pink-100"
                >
                  <ShoppingCart
                    size={21}
                  />

                  Go to Cart
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCart(
                      false
                    )
                  }
                  disabled={
                    addingToCart
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-pink-600 px-4 text-sm font-bold text-pink-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                >
                  <ShoppingCart
                    size={21}
                  />

                  {addingToCart
                    ? "Adding..."
                    : "Add to Cart"}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleAddToCart(
                    true
                  )
                }
                disabled={
                  addingToCart
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 text-sm font-bold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <ShoppingBag
                  size={21}
                />

                Buy Now
              </button>
            </div>

            {/* FEATURES */}

            <div className="mt-6 grid gap-3">
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

          <div
            className={`relative mt-6 overflow-hidden transition-all duration-300 ${
              showFullDescription
                ? "max-h-none"
                : "max-h-56"
            }`}
          >
            <p className="whitespace-pre-line leading-8 text-gray-600">
              {product.description?.trim() ||
                "Product description will be added soon."}
            </p>

            {!showFullDescription &&
              product.description?.trim() && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
              )}
          </div>

          {product.description?.trim() &&
            product.description.trim().length > 180 && (
              <button
                type="button"
                onClick={() =>
                  setShowFullDescription(
                    (previous) => !previous
                  )
                }
                className="mt-4 inline-flex items-center rounded-lg border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-600 transition hover:bg-pink-100 hover:text-pink-700"
              >
                {showFullDescription
                  ? "See Less"
                  : "See More"}
              </button>
            )}
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
              label="Images"
              value={`${productImages.length}`}
            />

            <Highlight
              label="Sizes"
              value={
                availableSizes.length >
                0
                  ? availableSizes.join(
                      ", "
                    )
                  : "Not Required"
              }
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
   GET AVAILABLE SIZES
======================================== */

function getAvailableSizes(
  product: Product
): string[] {
  if (
    !Array.isArray(
      product.variants
    )
  ) {
    return [];
  }

  const sizes =
    product.variants.flatMap(
      (variant) =>
        Array.isArray(
          variant.sizes
        )
          ? variant.sizes
          : []
    );

  return Array.from(
    new Set(
      sizes
        .map((size) =>
          String(size).trim()
        )
        .filter(Boolean)
    )
  );
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
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
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