"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useCart } from "@/context/CartContext";

import {
  ChevronDown,
  Loader2,
  LogIn,
  LogOut,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface UserApiResponse {
  success?: boolean;
  user?: Customer;
  message?: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const { totalItems } = useCart();

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const loadCustomer = async () => {
    try {
      setLoadingUser(true);

      const response = await fetch(
        "/api/user/me",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setCustomer(null);
        return;
      }

      const data =
        (await response.json()) as UserApiResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.user
      ) {
        setCustomer(null);
        return;
      }

      setCustomer(data.user);
    } catch (error) {
      console.error(
        "Customer session load error:",
        error
      );

      setCustomer(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    void loadCustomer();
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      router.push("/products");
      return;
    }

    router.push(
      `/products?search=${encodeURIComponent(
        query
      )}`
    );
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const response = await fetch(
        "/api/user/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Logout API returned an invalid response. Status: ${response.status}`
        );
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
            "Customer logout failed."
        );
      }

      setCustomer(null);
      setMenuOpen(false);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Customer logout error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Customer logout failed."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const firstName =
    customer?.name
      ?.trim()
      .split(/\s+/)[0] ||
    "Account";

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        {/* LOGO */}

        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 sm:gap-3"
        >
          <Image
            src="/logo.png"
            alt="DianaKart"
            width={55}
            height={55}
            priority
            className="h-10 w-10 shrink-0 object-contain sm:h-[55px] sm:w-[55px]"
          />

          <h1 className="truncate text-xl font-bold text-blue-900 sm:text-3xl">
            DianaKart
          </h1>
        </Link>

        {/* DESKTOP SEARCH */}

        <form
          onSubmit={handleSearch}
          className="relative hidden w-full max-w-[450px] md:block"
        >
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Search products..."
            className="w-full rounded-xl border-2 py-3 pl-11 pr-20 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-500"
          />

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
          >
            Search
          </button>
        </form>

        {/* RIGHT MENU */}

        <div className="flex shrink-0 items-center gap-2 font-semibold text-gray-700 sm:gap-5">
          {loadingUser ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 sm:gap-2 sm:text-sm">
              <Loader2
                size={18}
                className="animate-spin"
              />
              <span className="hidden sm:inline">
                Account
              </span>
            </div>
          ) : customer ? (
            <div
              ref={menuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    (currentValue) =>
                      !currentValue
                  )
                }
                className="flex items-center gap-1 rounded-lg px-1.5 py-2 transition hover:bg-gray-100 hover:text-orange-500 sm:gap-2 sm:px-2"
              >
                <UserRound size={19} />

                <span className="max-w-20 truncate text-sm sm:max-w-28 sm:text-base">
                  Hi, {firstName}
                </span>

                <ChevronDown
                  size={15}
                  className={`hidden transition sm:block ${
                    menuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate font-bold text-gray-900">
                      {customer.name}
                    </p>

                    <p className="mt-1 truncate text-xs font-normal text-gray-500">
                      {customer.email}
                    </p>
                  </div>

                  <Link
                    href="/account"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-gray-50 hover:text-orange-500"
                  >
                    <UserRound size={18} />
                    My Profile
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-gray-50 hover:text-orange-500"
                  >
                    <ShoppingCart size={18} />
                    My Orders
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loggingOut ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <LogOut size={18} />
                    )}

                    {loggingOut
                      ? "Logging Out..."
                      : "Logout"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm transition hover:text-orange-500 sm:gap-2 sm:text-base"
            >
              <LogIn size={19} />
              <span className="hidden xs:inline">
                Login
              </span>
            </Link>
          )}

          {/* CART */}

          <Link
            href="/cart"
            className="relative flex shrink-0 items-center gap-1 transition hover:text-orange-500 sm:gap-2"
          >
            <ShoppingCart size={21} />

            <span className="hidden sm:inline">
              Cart
            </span>

            {totalItems > 0 && (
              <span className="absolute -right-2 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white sm:-right-4">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* MOBILE SEARCH */}

      <div className="px-4 pb-4 md:hidden">
        <form
          onSubmit={handleSearch}
          className="relative"
        >
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Search products..."
            className="w-full rounded-xl border-2 py-3 pl-11 pr-20 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-500"
          />

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}