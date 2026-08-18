"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQty,
    decreaseQty,
  } = useCart();

  const totalQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const shipping = 0;
  const totalPrice = subtotal + shipping;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              <ShoppingBag className="h-8 w-8 text-blue-700" />
              Shopping Cart
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Review your selected products before checkout.
            </p>
          </div>

          <Link
            href="/products"
            className="hidden items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-600 hover:text-blue-700 sm:flex"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>
        </div>

        {cart.length === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <ShoppingBag className="h-10 w-10 text-blue-700" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              Browse our latest products and add your favourite items to the
              cart.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Start Shopping
            </Link>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="space-y-4">
              {cart.map((item) => (
                <article
                  key={`${item.id}-${item.size || "no-size"}`}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4 sm:gap-6">
                    <Link
                      href={`/products/${item.id}`}
                      className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-36 sm:w-28"
                    >
                      <Image
                        src={item.image || "/banner-girl.png"}
                        alt={item.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.id}`}>
                        <h2 className="line-clamp-2 text-base font-semibold text-gray-900 transition hover:text-blue-700 sm:text-lg">
                          {item.name}
                        </h2>
                      </Link>

                      {item.size && (
                        <div className="mt-2">
                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                            Size: {item.size}
                          </span>
                        </div>
                      )}

                      <p className="mt-3 text-lg font-bold text-gray-900">
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQty(
                                item.id,
                                item.size
                              )
                            }
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-l-xl text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={17} />
                          </button>

                          <span className="min-w-10 text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQty(
                                item.id,
                                item.size
                              )
                            }
                            aria-label={`Increase quantity of ${item.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-r-xl text-gray-700 transition hover:bg-gray-200"
                          >
                            <Plus size={17} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id,
                              item.size
                            )
                          }
                          className="flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700"
                        >
                          <Trash2 size={17} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              <Link
                href="/products"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:border-blue-600 hover:text-blue-700 sm:hidden"
              >
                <ArrowLeft size={18} />
                Continue Shopping
              </Link>
            </section>

            <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Total Items</span>

                  <span className="font-semibold text-gray-900">
                    {totalQuantity}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>

                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Shipping</span>

                  <span className="font-semibold text-green-600">
                    Free
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-gray-200" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Total Amount
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Inclusive of all charges
                  </p>
                </div>

                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </p>
              </div>

              <Link
                href="/checkout"
                className="mt-7 flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800"
              >
                Proceed to Checkout
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                You can review your delivery details before placing the order.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
