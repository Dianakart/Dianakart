"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  sellingPrice: number;
  stock: number;
  image?: string;
  images?: string[];
  status: "Active" | "Inactive";
  createdAt?: string;
}

export default function LatestProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const productList: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        const latestActiveProducts = productList
          .filter((product) => product.status === "Active")
          .sort((a, b) => {
            const dateA = a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;

            const dateB = b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;

            return dateB - dateA;
          })
          .slice(0, 8);

        setProducts(latestActiveProducts);
      } catch (error) {
        console.error("Latest products error:", error);
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getProductImage = (product: Product) => {
    if (product.image) {
      return product.image;
    }

    if (product.images && product.images.length > 0) {
      return product.images[0];
    }

    return "/banner-girl.png";
  };

  if (loading) {
    return (
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Latest Products
            </h2>

            <p className="mt-2 text-gray-500">
              Explore our latest selected products.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="aspect-[4/5] animate-pulse bg-gray-200" />

                <div className="space-y-3 p-4">
                  <div className="h-4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="font-medium text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Latest Products
          </h2>

          <p className="mt-3 text-gray-500">
            No active products are available right now.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Latest Products
            </h2>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Explore our latest selected products.
            </p>
          </div>

          <Link
            href="/products"
            className="hidden font-semibold text-pink-600 transition hover:text-pink-700 sm:block"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product._id}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={`/products/${product._id}`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/banner-girl.png";
                    }}
                  />

                  {product.stock <= 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-900">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3 sm:p-4">
                <p className="mb-1 truncate text-xs font-medium uppercase tracking-wide text-pink-600">
                  {product.category}
                </p>

                <Link href={`/products/${product._id}`}>
                  <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold text-gray-900 transition hover:text-pink-600 sm:text-base">
                    {product.name}
                  </h3>
                </Link>

                <div className="mt-3">
                  <p className="text-base font-bold text-gray-900 sm:text-lg">
                    ₹{Number(product.sellingPrice).toLocaleString("en-IN")}
                  </p>
                </div>

                <Link
                  href={`/products/${product._id}`}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
                >
                  View Product
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex rounded-xl border border-pink-600 px-6 py-3 font-semibold text-pink-600 transition hover:bg-pink-600 hover:text-white"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}