"use client";

import Link from "next/link";
import {
  Loader2,
  PackageSearch,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Product = {
  _id: string;

  name: string;

  sku?: string;
  brand?: string;
  category?: string;

  costPrice?: number;
  sellingPrice: number;

  stock?: number;

  image?: string;
  images?: string[];

  description?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;
};

function formatPrice(
  value: number
) {
  return `₹ ${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function getImage(
  product: Product
) {
  if (
    product.image &&
    product.image.trim()
  ) {
    return product.image;
  }

  if (
    Array.isArray(
      product.images
    ) &&
    product.images.length > 0
  ) {
    return (
      product.images[0] ||
      "/products/placeholder.jpg"
    );
  }

  return "/products/placeholder.jpg";
}

export default function FeaturedProducts() {
  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

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
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            "Unable to load products."
          );
        }

        if (
          !Array.isArray(data)
        ) {
          throw new Error(
            "Invalid products response."
          );
        }

        setProducts(
          data as Product[]
        );
      } catch (
        fetchError
      ) {
        console.error(
          "LATEST PRODUCTS ERROR:",
          fetchError
        );

        setError(
          fetchError instanceof
            Error
            ? fetchError.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadProducts();
  }, []);

  const latestProducts =
    useMemo(() => {
      return [...products]
        .filter(
          (product) =>
            product.status !==
            "Inactive"
        )
        .sort(
          (
            a,
            b
          ) => {
            const dateA =
              a.createdAt
                ? new Date(
                    a.createdAt
                  ).getTime()
                : 0;

            const dateB =
              b.createdAt
                ? new Date(
                    b.createdAt
                  ).getTime()
                : 0;

            return (
              dateB -
              dateA
            );
          }
        );
    }, [products]);

  return (
    <section 
    className="bg-white py-10 sm:py-12">
      <div className="w-full px-5 sm:px-8 lg:px-10">

        {/* HEADING */}

        <div className="mb-7 border-b border-gray-200 pb-5">
          <h2 className="text-xl font-semibold uppercase tracking-wide text-gray-900 sm:text-2xl">
            Latest Products
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Explore our newest arrivals
          </p>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading latest
                products...
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center">
              <p className="font-semibold text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadProducts()
                }
                className="mt-4 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Try Again
              </button>
            </div>
          )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          latestProducts.length ===
            0 && (
            <div className="py-20 text-center">
              <PackageSearch className="mx-auto h-12 w-12 text-gray-300" />

              <h3 className="mt-4 text-xl font-bold text-gray-900">
                No products yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                New products will
                appear here.
              </p>
            </div>
          )}

        {/* PRODUCT GRID */}

        {!loading &&
          !error &&
          latestProducts.length >
            0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
              {latestProducts.map(
                (
                  product
                ) => (
                  <Link
                    key={
                      product._id
                    }
                    href={`/products/${product._id}`}
                    className="group block"
                  >
                    {/* IMAGE */}

                    <div className="relative aspect--square w-full overflow-hidden bg-gray-100">
                      <img
                        src={getImage(
                          product
                        )}
                        alt={
                          product.name
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            "/products/placeholder.jpg";
                        }}
                      />
                    </div>

                    {/* INFO */}

                    <div className="pt-3">
                      <h3 className="line-clamp-2 text-sm font-medium uppercase tracking-wide text-gray-900 sm:text-[15px]">
                        {
                          product.name
                        }
                      </h3>

                      {product.brand && (
                        <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                          {
                            product.brand
                          }
                        </p>
                      )}

                      <div className="mt-1.5">
                        <span className="text-sm font-bold text-gray-900 sm:text-base">
                          {formatPrice(
                            product.sellingPrice
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
      </div>
    </section>
  );
}