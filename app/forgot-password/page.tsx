"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  ArrowLeft,
  KeyRound,
  LoaderCircle,
  Mail,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/user/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to process password reset."
        );
        return;
      }

      setMessage(
        data.message ||
          "Password reset request accepted."
      );
    } catch (submitError) {
      console.error(
        "Forgot password error:",
        submitError
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 px-7 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <KeyRound size={28} />
            </div>

            <h1 className="text-3xl font-bold">
              Forgot Password
            </h1>

            <p className="mt-2 text-sm text-white/90">
              Enter your registered email address
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-7 sm:px-8"
          >
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {message}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    setMessage("");
                  }}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={17} />
              Back to Login
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}