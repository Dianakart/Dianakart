"use client";

import { useEffect, useState } from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  status: "Active" | "Inactive";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Categories load nahi hui");
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Categories load nahi hui"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("❌ Category name enter karo");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim(),
          status: "Active",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Category add nahi hui");
      }

      setName("");
      setImage("");
      setMessage("✅ Category successfully added");

      await loadCategories();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Category add nahi hui"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Category Management
          </h1>

          <p className="mt-2 text-gray-600">
            Add and manage DianaKart product categories.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 font-medium text-gray-900 shadow-sm">
            {message}
          </div>
        )}

        <form
          onSubmit={addCategory}
          className="mb-8 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Add Category
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Category Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example: Dresses"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Image URL
              </label>

              <input
                type="text"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="/categories/dresses.jpg"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-sm text-gray-500">
                Image file public/categories folder me honi chahiye.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add Category"}
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Image</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Slug</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-600"
                    >
                      Categories loading...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-600"
                    >
                      Abhi koi category add nahi hui.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        {category.image ? (
                          <img
  src={category.image || "/logo.png"}
  alt={category.name}
  className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
  onError={(event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/logo.png";
  }}
/>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-xs text-gray-500">
                            No image
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {category.name}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {category.slug}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            category.status === "Active"
                              ? "rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700"
                              : "rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                          }
                        >
                          {category.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && (
          <p className="mt-4 text-sm text-gray-600">
            Total categories: {categories.length}
          </p>
        )}
      </div>
    </div>
  );
}