import Link from "next/link";
import { Clock, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        
        {/* BRAND */}
        <div>
          <img
            src="/logo.png"
            alt="DianaKart"
            className="mb-3 h-12 w-auto"
          />

          <p className="text-gray-400">
            Fashion for Every Style
          </p>

          <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
            Discover stylish fashion products at DianaKart.
            Shop your favourite styles with a simple and
            convenient shopping experience.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">
            Quick Links
          </h3>

          <ul className="space-y-3">
            <li>
              <Link
                href="/"
                className="transition hover:text-pink-400"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/#latest-products"
                className="transition hover:text-pink-400"
              >
                Latest Products
              </Link>
            </li>

            <li>
              <Link
                href="/account"
                className="transition hover:text-pink-400"
              >
                My Account
              </Link>
            </li>

            <li>
              <Link
                href="/orders"
                className="transition hover:text-pink-400"
              >
                My Orders
              </Link>
            </li>

            <li>
              <Link
                href="/cart"
                className="transition hover:text-pink-400"
              >
                Cart
              </Link>
            </li>
          </ul>
        </div>

        {/* CUSTOMER SUPPORT */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">
            Customer Support
          </h3>

          <a
            href="mailto:support.dianakart@gmail.com"
            className="flex items-center gap-2 break-all transition hover:text-pink-400"
          >
            <Mail size={18} />
            support.dianakart@gmail.com
          </a>

          <p className="mt-4 text-gray-400">
            Need help with an order or product? Feel free
            to contact us anytime.
          </p>

          <div className="mt-6 flex items-center gap-2 text-gray-400">
            <Clock size={18} />
            <span>Monday - Saturday</span>
          </div>

          <p className="ml-7 mt-1 text-gray-400">
            10:00 AM - 7:00 PM
          </p>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-gray-800 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-sm text-gray-500 sm:flex-row">
          <p>
            © 2026 DianaKart. All rights reserved.
          </p>

          <p>
            Thank you for shopping with DianaKart
          </p>
        </div>
      </div>
    </footer>
  );
}