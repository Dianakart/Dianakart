"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

type ApiResponse = {
  success?: boolean;
  message?: string;
  email?: string;
  retryAfter?: number;
  resetToken?: string;
};

const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpMode, setOtpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCountdown]);

  const requestOtp = async (
    targetEmail: string,
    isResend = false
  ) => {
    const cleanEmail =
      targetEmail
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    try {
      if (isResend) {
        setResending(true);
      } else {
        setLoading(true);
      }

      setError("");
      setMessage("");

      const response = await fetch(
        "/api/user/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        if (
          response.status === 429 &&
          data.retryAfter
        ) {
          setResendCountdown(
            data.retryAfter
          );
        }

        setError(
          data.message ||
            "Unable to send password reset code."
        );
        return;
      }

      setVerificationEmail(
        data.email || cleanEmail
      );

      setOtpMode(true);
      setOtp("");

      setMessage(
        data.message ||
          "Password reset code sent to your email."
      );

      setResendCountdown(
        RESEND_SECONDS
      );
    } catch (requestError) {
      console.error(
        "Forgot password error:",
        requestError
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await requestOtp(email);
  };

  const handleVerify = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    try {
      setVerifying(true);

      const response = await fetch(
        "/api/user/verify-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: verificationEmail,
            otp,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.resetToken
      ) {
        setError(
          data.message ||
            "Unable to verify code."
        );
        return;
      }

      router.push(
        `/reset-password?token=${encodeURIComponent(
          data.resetToken
        )}`
      );
    } catch (verifyError) {
      console.error(
        "Reset OTP verification error:",
        verifyError
      );

      setError(
        "Unable to verify the code."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleChangeEmail = () => {
    setOtpMode(false);
    setVerificationEmail("");
    setOtp("");
    setError("");
    setMessage("");
    setResendCountdown(0);
  };

  if (otpMode) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 px-7 py-8 text-center text-white">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <ShieldCheck size={28} />
              </div>

              <h1 className="text-3xl font-bold">
                Verify Reset Code
              </h1>

              <p className="mt-2 text-sm text-white/90">
                Enter the code sent to your email
              </p>
            </div>

            <form
              onSubmit={handleVerify}
              className="space-y-5 px-6 py-7 sm:px-8"
            >
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to
                </p>

                <p className="mt-1 break-all font-bold text-gray-900">
                  {verificationEmail}
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  <CheckCircle2
                    className="mt-0.5 shrink-0"
                    size={18}
                  />
                  <span>{message}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-center text-sm font-semibold text-gray-700"
                >
                  Verification Code
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => {
                    setOtp(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    );

                    setError("");
                    setMessage("");
                  }}
                  maxLength={6}
                  autoFocus
                  disabled={verifying}
                  placeholder="000000"
                  className="h-16 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center text-3xl font-bold tracking-[0.45em] text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100 disabled:opacity-60"
                />

                <p className="mt-2 text-center text-xs text-gray-500">
                  Code is valid for 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  verifying ||
                  otp.length !== 6
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? (
                  <>
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={20}
                    />
                    Verify Code
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Didn&apos;t receive the code?
                </p>

                <button
                  type="button"
                  disabled={
                    resending ||
                    resendCountdown > 0
                  }
                  onClick={() =>
                    void requestOtp(
                      verificationEmail,
                      true
                    )
                  }
                  className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {resending ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : resendCountdown >
                    0 ? (
                    `Resend code in ${resendCountdown}s`
                  ) : (
                    <>
                      <RefreshCcw size={16} />
                      Resend Code
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={
                  handleChangeEmail
                }
                className="mx-auto flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600"
              >
                <ArrowLeft size={17} />
                Change Email
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

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
                    setEmail(
                      event.target.value
                    );
                    setError("");
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
                  Sending Code...
                </>
              ) : (
                "Send Reset Code"
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