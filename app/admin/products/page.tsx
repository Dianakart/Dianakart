"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  sku: string;
  brand?: string;
  category: string;
  supplier?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  image?: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");

  const [deleteProduct, setDeleteProduct] =
    useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Products load nahi hue"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Products ka response invalid hai");
      }

      setProducts(data);
    } catch (error) {
      console.error("Products load error:", error);

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Products load nahi hue"
      );

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const searchValue = searchText.trim().toLowerCase();

    if (!searchValue) {
      return products;
    }

    return products.filter((product) => {
      const searchableValues = [
        product.name,
        product.sku,
        product.category,
        product.brand || "",
        product.supplier || "",
        product.status,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(searchValue)
      );
    });
  }, [products, searchText]);

  const handleDeleteProduct = async () => {
    if (!deleteProduct) {
      return;
    }

    try {
      setDeleting(true);
      setMessage("");

      const response = await fetch(
        `/api/products/${deleteProduct._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Product delete nahi hua"
        );
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product._id !== deleteProduct._id
        )
      );

      setDeleteProduct(null);
      setMessage("✅ Product successfully delete ho gaya");
    } catch (error) {
      console.error("Delete product error:", error);

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Product delete nahi hua"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Management
              </h1>

              <p className="mt-2 text-gray-600">
                Manage all DianaKart products.
              </p>
            </div>

            <Link
              href="/admin/add-product"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              <Plus size={20} />

              Add Product
            </Link>
          </div>

          {/* Success / Error Message */}
          {message && (
            <div
              className={`mb-6 flex items-center justify-between rounded-xl border p-4 font-medium ${
                message.startsWith("✅")
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span>{message}</span>

              <button
                type="button"
                onClick={() => setMessage("")}
                className="rounded-md p-1 hover:bg-black/5"
                aria-label="Close message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <div className="relative max-w-md">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search name, SKU, category or brand"
                className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center rounded-2xl bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600" />

                <p className="mt-4 font-medium text-gray-600">
                  Products load ho rahe hain...
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
              <div className="text-6xl">📦</div>

              <h2 className="mt-5 text-2xl font-bold text-gray-900">
                {products.length === 0
                  ? "Abhi koi product nahi hai"
                  : "Search se koi product nahi mila"}
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-gray-600">
                {products.length === 0
                  ? "DianaKart me apna pehla product add karo."
                  : "Koi doosra product name, SKU, category ya brand search karo."}
              </p>

              {products.length === 0 && (
                <Link
                  href="/admin/add-product"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700"
                >
                  <Plus size={20} />

                  Add First Product
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Product
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          SKU
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Category
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Cost
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Selling
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Profit
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Stock
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Status
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => {
                        const profit =
                          Number(product.sellingPrice) -
                          Number(product.costPrice);

                        const hasImage = Boolean(product.image);

                        const isActive =
                          product.status?.toLowerCase() ===
                          "active";

                        return (
                          <tr
                            key={product._id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                  {hasImage ? (
                                    <Image
                                      src={product.image as string}
                                      alt={product.name}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xl">
                                      📦
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[220px] truncate font-bold text-gray-900">
                                    {product.name}
                                  </p>

                                  <p className="mt-1 max-w-[220px] truncate text-sm uppercase text-gray-500">
                                    {product.brand ||
                                      "No Brand"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 font-medium text-gray-700">
                              {product.sku}
                            </td>

                            <td className="px-5 py-4 text-gray-700">
                              {product.category}
                            </td>

                            <td className="px-5 py-4 text-gray-700">
                              ₹
                              {Number(
                                product.costPrice
                              ).toLocaleString("en-IN")}
                            </td>

                            <td className="px-5 py-4 font-bold text-gray-900">
                              ₹
                              {Number(
                                product.sellingPrice
                              ).toLocaleString("en-IN")}
                            </td>

                            <td
                              className={`px-5 py-4 font-bold ${
                                profit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {profit >= 0 ? "+" : ""}₹
                              {profit.toLocaleString("en-IN")}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`font-semibold ${
                                  product.stock <= 0
                                    ? "text-red-600"
                                    : product.stock <= 5
                                      ? "text-orange-600"
                                      : "text-gray-900"
                                }`}
                              >
                                {product.stock}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {product.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  href={`/admin/products/edit/${product._id}`}
                                  title="Edit Product"
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition hover:bg-blue-200"
                                >
                                  <Pencil size={18} />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteProduct(product)
                                  }
                                  title="Delete Product"
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 transition hover:bg-red-200"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="grid gap-4 lg:hidden">
                {filteredProducts.map((product) => {
                  const profit =
                    Number(product.sellingPrice) -
                    Number(product.costPrice);

                  const isActive =
                    product.status?.toLowerCase() === "active";

                  return (
                    <div
                      key={product._id}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              📦
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-lg font-bold text-gray-900">
                            {product.name}
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            SKU: {product.sku}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {product.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">
                            Category
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {product.category}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">
                            Stock
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {product.stock}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-gray-500">
                            Selling Price
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            ₹
                            {Number(
                              product.sellingPrice
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-3">
                          <p className="text-gray-500">
                            Profit
                          </p>

                          <p
                            className={`mt-1 font-bold ${
                              profit >= 0
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            ₹{profit.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <Link
                          href={`/admin/products/edit/${product._id}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-200"
                        >
                          <Pencil size={18} />

                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteProduct(product)
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-3 font-semibold text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={18} />

                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-sm text-gray-600">
                Showing products: {filteredProducts.length}
                {searchText.trim() &&
                  ` of ${products.length}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 size={24} />
              </div>

              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                disabled={deleting}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close delete popup"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Product Delete Karein?
            </h2>

            <p className="mt-3 leading-6 text-gray-600">
              Kya aap{" "}
              <span className="font-bold text-gray-900">
                {deleteProduct.name}
              </span>{" "}
              ko permanently delete karna chahte hain?
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />

                {deleting
                  ? "Deleting..."
                  : "Yes, Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}