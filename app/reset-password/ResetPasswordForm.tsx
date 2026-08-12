"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Password reset link is invalid.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/user/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to reset password."
        );
        return;
      }

      setMessage(
        data.message ||
          "Password reset successful."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (resetError) {
      console.error(
        "Reset password error:",
        resetError
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 px-7 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <KeyRound size={28} />
          </div>

          <h1 className="text-3xl font-bold">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-white/90">
            Create a new password for your account
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

          <PasswordField
            label="New Password"
            value={password}
            setValue={setPassword}
            visible={showPassword}
            toggle={() =>
              setShowPassword((value) => !value)
            }
            placeholder="Enter new password"
          />

          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            visible={showConfirmPassword}
            toggle={() =>
              setShowConfirmPassword(
                (value) => !value
              )
            }
            placeholder="Enter password again"
          />

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
                Updating...
              </>
            ) : (
              "Reset Password"
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
  );
}

function PasswordField({
  label,
  value,
  setValue,
  visible,
  toggle,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  visible: boolean;
  toggle: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            setValue(event.target.value)
          }
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-pink-600"
        >
          {visible ? (
            <EyeOff size={19} />
          ) : (
            <Eye size={19} />
          )}
        </button>
      </div>
    </div>
  );
}