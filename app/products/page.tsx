"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Search,
  ShoppingBag,
} from "lucide-react";

const FALLBACK_IMAGE =
  "/products/placeholder.jpg";

type Product = {
  _id: string;

  name: string;

  brand?: string;
  category?: string;

  sellingPrice?: number;
  oldPrice?: number;
  mrp?: number;

  stock?: number;

  image?: string;
  images?: string[];

  description?: string;

  status?: string;

  createdAt?: string;
};

type SortOption =
  | "newest"
  | "price-low"
  | "price-high"
  | "name";

/* ========================================
   PAGE WRAPPER
======================================== */

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-pink-600" />

            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading products...
            </p>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

/* ========================================
   PRODUCTS CONTENT
======================================== */

function ProductsContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const searchFromUrl =
    searchParams.get(
      "search"
    ) || "";

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    searchText,
    setSearchText,
  ] =
    useState(
      searchFromUrl
    );

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortOption>(
      "newest"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /* ========================================
     SYNC URL SEARCH
  ======================================== */

  useEffect(() => {
    setSearchText(
      searchFromUrl
    );
  }, [searchFromUrl]);

  /* ========================================
     LOAD PRODUCTS
  ======================================== */

  const loadProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/products",
            {
              method: "GET",
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.error ||
              "Products could not be loaded."
          );
        }

        const productList: Product[] =
          Array.isArray(
            data
          )
            ? data
            : Array.isArray(
                data?.products
              )
            ? data.products
            : [];

        const activeProducts =
          productList.filter(
            (
              product
            ) => {
              if (
                !product.status
              ) {
                return true;
              }

              return (
                product.status.toLowerCase() ===
                "active"
              );
            }
          );

        setProducts(
          activeProducts
        );
      } catch (
        loadError
      ) {
        console.error(
          "PRODUCTS LOAD ERROR:",
          loadError
        );

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Products could not be loaded."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    void loadProducts();
  }, []);

  /* ========================================
     SEARCH + SORT
  ======================================== */

  const visibleProducts =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      const filtered =
        products.filter(
          (
            product
          ) => {
            if (!query) {
              return true;
            }

            const searchableValues =
              [
                product.name,
                product.brand,
                product.category,
                product.description,
              ];

            return searchableValues
              .filter(
                Boolean
              )
              .some(
                (
                  value
                ) =>
                  String(
                    value
                  )
                    .toLowerCase()
                    .includes(
                      query
                    )
              );
          }
        );

      return [
        ...filtered,
      ].sort(
        (
          first,
          second
        ) => {
          const firstPrice =
            Number(
              first.sellingPrice ||
                0
            );

          const secondPrice =
            Number(
              second.sellingPrice ||
                0
            );

          if (
            sortBy ===
            "price-low"
          ) {
            return (
              firstPrice -
              secondPrice
            );
          }

          if (
            sortBy ===
            "price-high"
          ) {
            return (
              secondPrice -
              firstPrice
            );
          }

          if (
            sortBy ===
            "name"
          ) {
            return String(
              first.name ||
                ""
            ).localeCompare(
              String(
                second.name ||
                  ""
              )
            );
          }

          return (
            new Date(
              second.createdAt ||
                0
            ).getTime() -
            new Date(
              first.createdAt ||
                0
            ).getTime()
          );
        }
      );
    }, [
      products,
      searchText,
      sortBy,
    ]);

  /* ========================================
     SEARCH HANDLER
  ======================================== */

  const handleSearch =
    () => {
      const query =
        searchText.trim();

      if (!query) {
        router.replace(
          "/products"
        );

        return;
      }

      router.replace(
        `/products?search=${encodeURIComponent(
          query
        )}`
      );
    };

  const clearSearch =
    () => {
      setSearchText("");

      router.replace(
        "/products"
      );
    };

  /* ========================================
     PAGE
  ======================================== */

  return (
    <main className="min-h-screen bg-white">

      {/* TOP */}

      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-pink-600"
          >
            <ArrowLeft
              size={17}
            />

            Back to Shopping
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Products
          </h1>

          {searchFromUrl ? (
            <p className="mt-2 text-sm text-gray-500">
              Search results
              for{" "}
              <span className="font-semibold text-gray-900">
                “
                {
                  searchFromUrl
                }
                ”
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Explore DianaKart
              products.
            </p>
          )}
        </div>
      </section>

      {/* SEARCH + SORT */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:px-8">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event
                    .target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleSearch();
                }
              }}
              placeholder="Search product name..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-24 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />

            <button
              type="button"
              onClick={
                handleSearch
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Search
            </button>
          </div>

          {/* SORT */}

          <div className="relative">
            <select
              value={
                sortBy
              }
              onChange={(
                event
              ) =>
                setSortBy(
                  event
                    .target
                    .value as SortOption
                )
              }
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-4 pr-11 font-medium text-gray-700 outline-none focus:border-pink-500 lg:min-w-52"
            >
              <option value="newest">
                Newest First
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchFromUrl
                ? "Search Results"
                : "All Products"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {
                visibleProducts.length
              }{" "}
              product
              {visibleProducts.length ===
              1
                ? ""
                : "s"}{" "}
              found
            </p>
          </div>

          {searchText && (
            <button
              type="button"
              onClick={
                clearSearch
              }
              className="text-sm font-semibold text-pink-600 transition hover:text-pink-700"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* LOADING */}

        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <EmptyState
            title="Products could not be loaded"
            text={
              error
            }
          />
        ) : visibleProducts.length ===
          0 ? (
          <EmptyState
            title="No products found"
            text="Try another product name."
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map(
              (
                product
              ) => (
                <ProductCard
                  key={
                    product._id
                  }
                  product={
                    product
                  }
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

/* ========================================
   PRODUCT CARD
======================================== */

function ProductCard({
  product,
}: {
  product: Product;
}) {
  const imageUrl =
    product.image ||
    (Array.isArray(
      product.images
    )
      ? product.images[0]
      : "") ||
    FALLBACK_IMAGE;

  const sellingPrice =
    Number(
      product.sellingPrice ||
        0
    );

  const oldPrice =
    Number(
      product.mrp ||
        product.oldPrice ||
        0
    );

  const discount =
    oldPrice >
      sellingPrice &&
    oldPrice > 0
      ? Math.round(
          ((oldPrice -
            sellingPrice) /
            oldPrice) *
            100
        )
      : 0;

  const isOutOfStock =
    Number(
      product.stock ||
        0
    ) <= 0;

  return (
    <article className="group">
      <Link
        href={`/products/${product._id}`}
        className="block"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={
              imageUrl
            }
            alt={
              product.name
            }
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />

          {discount >
            0 && (
            <span className="absolute left-3 top-3 rounded bg-white px-2.5 py-1 text-xs font-bold text-pink-600 shadow-sm">
              {
                discount
              }
              % OFF
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-red-600">
                Out of
                Stock
              </span>
            </div>
          )}
        </div>

        <div className="pt-3">
          {product.brand && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {
                product.brand
              }
            </p>
          )}

          <h3 className="mt-1 line-clamp-2 text-sm font-semibold uppercase tracking-wide text-gray-900">
            {
              product.name
            }
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-900">
              ₹{" "}
              {sellingPrice.toLocaleString(
                "en-IN"
              )}
            </span>

            {oldPrice >
              sellingPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{" "}
                {oldPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
          </div>

          <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pink-600">
            <ShoppingBag
              size={16}
            />

            View Product
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ========================================
   EMPTY STATE
======================================== */

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
      <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />

      <h2 className="mt-5 text-xl font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-2 text-gray-500">
        {text}
      </p>
    </div>
  );
}

/* ========================================
   SKELETON
======================================== */

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({
        length: 8,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={
              index
            }
            className="animate-pulse"
          >
            <div className="aspect-square bg-gray-200" />

            <div className="mt-3 h-3 w-24 rounded bg-gray-200" />

            <div className="mt-3 h-5 w-4/5 rounded bg-gray-200" />

            <div className="mt-3 h-5 w-24 rounded bg-gray-200" />
          </div>
        )
      )}
    </div>
  );
}