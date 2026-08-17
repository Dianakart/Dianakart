"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCcw,
  ShieldCheck,
  User,
} from "lucide-react";

type RegisterFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<
  Record<keyof RegisterFormData, string>
>;

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  requiresVerification?: boolean;
  email?: string;
  retryAfter?: number;
};

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const RESEND_SECONDS = 60;

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] =
    useState<RegisterFormData>(
      initialFormData
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [
    serverError,
    setServerError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  // ==============================
  // OTP STATE
  // ==============================

  const [
    verificationMode,
    setVerificationMode,
  ] = useState(false);

  const [
    verificationEmail,
    setVerificationEmail,
  ] = useState("");

  const [otp, setOtp] =
    useState("");

  const [
    verifyingOtp,
    setVerifyingOtp,
  ] = useState(false);

  const [
    resendingOtp,
    setResendingOtp,
  ] = useState(false);

  const [
    resendCountdown,
    setResendCountdown,
  ] = useState(0);

  // ==============================
  // RESEND COUNTDOWN
  // ==============================

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setResendCountdown(
          (currentValue) => {
            if (
              currentValue <= 1
            ) {
              window.clearInterval(
                timer
              );

              return 0;
            }

            return (
              currentValue - 1
            );
          }
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [resendCountdown]);

  // ==============================
  // REGISTER VALIDATION
  // ==============================

  const validateForm = () => {
    const newErrors: FormErrors =
      {};

    const name =
      formData.name.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const phone =
      formData.phone.trim();

    if (!name) {
      newErrors.name =
        "Full name is required.";
    } else if (
      name.length < 3
    ) {
      newErrors.name =
        "Name must contain at least 3 characters.";
    }

    if (!email) {
      newErrors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      newErrors.email =
        "Enter a valid email address.";
    }

    if (!phone) {
      newErrors.phone =
        "Mobile number is required.";
    } else if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.password) {
      newErrors.password =
        "Password is required.";
    } else if (
      formData.password.length <
      8
    ) {
      newErrors.password =
        "Password must contain at least 8 characters.";
    } else if (
      !/[A-Za-z]/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must contain at least one letter.";
    } else if (
      !/\d/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must contain at least one number.";
    }

    if (
      !formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !==
      formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  // ==============================
  // FORM CHANGE
  // ==============================

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = event.target;

    let updatedValue =
      value;

    if (
      name === "phone"
    ) {
      updatedValue =
        value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            10
          );
    }

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,
        [name]:
          updatedValue,
      })
    );

    setErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,
        [name]:
          undefined,
      })
    );

    setServerError("");
    setSuccessMessage("");
  };

  // ==============================
  // REGISTER
  // ==============================

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setServerError("");
      setSuccessMessage("");

      if (
        !validateForm()
      ) {
        return;
      }

      try {
        setIsLoading(true);

        const response =
          await fetch(
            "/api/user/register",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  name:
                    formData.name.trim(),

                  email:
                    formData.email
                      .trim()
                      .toLowerCase(),

                  phone:
                    formData.phone.trim(),

                  password:
                    formData.password,

                  confirmPassword:
                    formData.confirmPassword,
                }),
            }
          );

        const result =
          (await response.json()) as ApiResponse;

        /*
         * Account can exist even if
         * Brevo temporarily fails.
         * In that case allow the user
         * to reach verification screen
         * and use Resend OTP.
         */
        if (
          result.requiresVerification &&
          result.email
        ) {
          setVerificationEmail(
            result.email
          );

          setVerificationMode(
            true
          );

          setOtp("");

          if (
            response.ok
          ) {
            setSuccessMessage(
              result.message ||
                "Verification code sent to your email."
            );

            setResendCountdown(
              RESEND_SECONDS
            );
          } else {
            setServerError(
              result.message ||
                "Please request a new verification code."
            );

            setResendCountdown(
              0
            );
          }

          return;
        }

        if (!response.ok) {
          setServerError(
            result.message ||
              result.error ||
              "Registration failed."
          );

          return;
        }

        setServerError(
          "Unable to start email verification."
        );
      } catch (error) {
        console.error(
          "Registration error:",
          error
        );

        setServerError(
          "Unable to create your account. Please try again."
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };

  // ==============================
  // OTP INPUT
  // ==============================

  const handleOtpChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    setOtp(
      value
    );

    setServerError("");
    setSuccessMessage("");
  };

  // ==============================
  // VERIFY OTP
  // ==============================

  const handleVerifyOtp =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setServerError("");
      setSuccessMessage("");

      if (
        !/^\d{6}$/.test(
          otp
        )
      ) {
        setServerError(
          "Please enter the 6-digit verification code."
        );

        return;
      }

      try {
        setVerifyingOtp(
          true
        );

        const response =
          await fetch(
            "/api/user/verify-email",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  email:
                    verificationEmail,

                  otp,
                }),
            }
          );

        const result =
          (await response.json()) as ApiResponse;

        if (!response.ok) {
          setServerError(
            result.message ||
              "Unable to verify OTP."
          );

          return;
        }

        setSuccessMessage(
          result.message ||
            "Email verified successfully."
        );

        window.setTimeout(
          () => {
            router.replace(
              "/"
            );

            router.refresh();
          },
          900
        );
      } catch (error) {
        console.error(
          "OTP verification error:",
          error
        );

        setServerError(
          "Unable to verify your email. Please try again."
        );
      } finally {
        setVerifyingOtp(
          false
        );
      }
    };

  // ==============================
  // RESEND OTP
  // ==============================

  const handleResendOtp =
    async () => {
      if (
        resendingOtp ||
        resendCountdown > 0
      ) {
        return;
      }

      setServerError("");
      setSuccessMessage("");

      try {
        setResendingOtp(
          true
        );

        const response =
          await fetch(
            "/api/user/resend-otp",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email:
                    verificationEmail,
                }),
            }
          );

        const result =
          (await response.json()) as ApiResponse;

        if (!response.ok) {
          if (
            response.status ===
              429 &&
            result.retryAfter
          ) {
            setResendCountdown(
              result.retryAfter
            );
          }

          setServerError(
            result.message ||
              "Unable to resend verification code."
          );

          return;
        }

        setOtp("");

        setSuccessMessage(
          result.message ||
            "A new verification code has been sent."
        );

        setResendCountdown(
          RESEND_SECONDS
        );
      } catch (error) {
        console.error(
          "Resend OTP error:",
          error
        );

        setServerError(
          "Unable to resend verification code. Please try again."
        );
      } finally {
        setResendingOtp(
          false
        );
      }
    };

  // ==============================
  // CHANGE EMAIL
  // ==============================

  const handleChangeEmail =
    () => {
      setVerificationMode(
        false
      );

      setVerificationEmail(
        ""
      );

      setOtp("");

      setServerError("");

      setSuccessMessage("");

      setResendCountdown(
        0
      );
    };

  // ==============================
  // OTP SCREEN
  // ==============================

  if (
    verificationMode
  ) {
    return (
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">

          <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 px-7 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <ShieldCheck
                size={29}
              />
            </div>

            <h1 className="text-3xl font-bold">
              Verify Email
            </h1>

            <p className="mt-2 text-sm text-white/90">
              Enter the code sent to your email
            </p>
          </div>

          <form
            onSubmit={
              handleVerifyOtp
            }
            className="space-y-5 px-6 py-7 sm:px-8"
          >
            <div className="text-center">
              <p className="text-sm leading-6 text-gray-600">
                We sent a
                6-digit verification
                code to
              </p>

              <p className="mt-1 break-all font-bold text-gray-900">
                {
                  verificationEmail
                }
              </p>
            </div>

            {serverError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {
                  serverError
                }
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
              >
                <CheckCircle2
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <span>
                  {
                    successMessage
                  }
                </span>
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
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={
                  handleOtpChange
                }
                disabled={
                  verifyingOtp
                }
                maxLength={6}
                autoFocus
                placeholder="000000"
                className="h-16 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center text-3xl font-bold tracking-[0.45em] text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-center text-xs text-gray-500">
                OTP is valid
                for 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={
                verifyingOtp ||
                otp.length !==
                  6
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 font-semibold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifyingOtp ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={20}
                  />

                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck
                    size={20}
                  />

                  Verify Email
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive
                the code?
              </p>

              <button
                type="button"
                onClick={
                  handleResendOtp
                }
                disabled={
                  resendingOtp ||
                  resendCountdown >
                    0
                }
                className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-pink-600 transition hover:text-pink-700 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {resendingOtp ? (
                  <>
                    <LoaderCircle
                      className="animate-spin"
                      size={16}
                    />

                    Sending...
                  </>
                ) : resendCountdown >
                  0 ? (
                  `Resend OTP in ${resendCountdown}s`
                ) : (
                  <>
                    <RefreshCcw
                      size={16}
                    />

                    Resend OTP
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={
                handleChangeEmail
              }
              disabled={
                verifyingOtp ||
                resendingOtp
              }
              className="mx-auto flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft
                size={16}
              />

              Change Email
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==============================
  // REGISTER SCREEN
  // ==============================

  return (
    <div className="w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">

        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 px-7 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <User
              size={28}
            />
          </div>

          <h1 className="text-3xl font-bold">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-white/90">
            Join DianaKart and
            start shopping today
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          noValidate
          className="space-y-5 px-6 py-7 sm:px-8"
        >
          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {
                serverError
              }
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
            >
              {
                successMessage
              }
            </div>
          )}

          <InputField
            label="Full Name"
            name="name"
            type="text"
            value={
              formData.name
            }
            placeholder="Enter your full name"
            autoComplete="name"
            error={
              errors.name
            }
            disabled={
              isLoading
            }
            icon={
              <User
                size={19}
              />
            }
            onChange={
              handleChange
            }
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={
              formData.email
            }
            placeholder="Enter your email address"
            autoComplete="email"
            error={
              errors.email
            }
            disabled={
              isLoading
            }
            icon={
              <Mail
                size={19}
              />
            }
            onChange={
              handleChange
            }
          />

          <InputField
            label="Mobile Number"
            name="phone"
            type="tel"
            value={
              formData.phone
            }
            placeholder="Enter 10-digit mobile number"
            autoComplete="tel"
            inputMode="numeric"
            error={
              errors.phone
            }
            disabled={
              isLoading
            }
            icon={
              <Phone
                size={19}
              />
            }
            onChange={
              handleChange
            }
          />

          <PasswordField
            label="Password"
            name="password"
            value={
              formData.password
            }
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            error={
              errors.password
            }
            disabled={
              isLoading
            }
            visible={
              showPassword
            }
            onToggleVisibility={() =>
              setShowPassword(
                (
                  currentValue
                ) =>
                  !currentValue
              )
            }
            onChange={
              handleChange
            }
          />

          <PasswordField
            label="Confirm Password"
            name="confirmPassword"
            value={
              formData.confirmPassword
            }
            placeholder="Enter password again"
            autoComplete="new-password"
            error={
              errors.confirmPassword
            }
            disabled={
              isLoading
            }
            visible={
              showConfirmPassword
            }
            onToggleVisibility={() =>
              setShowConfirmPassword(
                (
                  currentValue
                ) =>
                  !currentValue
              )
            }
            onChange={
              handleChange
            }
          />

          <p className="text-xs leading-5 text-gray-500">
            By creating an
            account, you agree
            to DianaKart&apos;s{" "}

            <Link
              href="/terms"
              className="font-semibold text-pink-600 hover:underline"
            >
              Terms
            </Link>{" "}

            and{" "}

            <Link
              href="/privacy"
              className="font-semibold text-pink-600 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={
              isLoading
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 font-semibold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  size={20}
                />

                Sending OTP...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wider text-gray-400">
                Already registered?
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an
            account?{" "}

            <Link
              href="/login"
              className="font-bold text-pink-600 transition hover:text-pink-700 hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

// =====================================
// NORMAL INPUT
// =====================================

type InputFieldProps = {
  label: string;
  name:
    keyof RegisterFormData;
  type: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  disabled: boolean;
  icon:
    React.ReactNode;
  inputMode?:
    | "text"
    | "numeric"
    | "tel"
    | "email";

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function InputField({
  label,
  name,
  type,
  value,
  placeholder,
  autoComplete,
  error,
  disabled,
  icon,
  inputMode,
  onChange,
}: InputFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
          {icon}
        </span>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={
            placeholder
          }
          autoComplete={
            autoComplete
          }
          inputMode={
            inputMode
          }
          disabled={
            disabled
          }
          onChange={
            onChange
          }
          aria-invalid={
            Boolean(error)
          }
          aria-describedby={
            error
              ? `${name}-error`
              : undefined
          }
          className={`h-12 w-full rounded-xl border bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : "border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100"
          }`}
        />
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// =====================================
// PASSWORD INPUT
// =====================================

type PasswordFieldProps = {
  label: string;
  name:
    | "password"
    | "confirmPassword";
  value: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  disabled: boolean;
  visible: boolean;
  onToggleVisibility:
    () => void;

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

function PasswordField({
  label,
  name,
  value,
  placeholder,
  autoComplete,
  error,
  disabled,
  visible,
  onToggleVisibility,
  onChange,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
          <LockKeyhole
            size={19}
          />
        </span>

        <input
          id={name}
          name={name}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          placeholder={
            placeholder
          }
          autoComplete={
            autoComplete
          }
          disabled={
            disabled
          }
          onChange={
            onChange
          }
          aria-invalid={
            Boolean(error)
          }
          aria-describedby={
            error
              ? `${name}-error`
              : undefined
          }
          className={`h-12 w-full rounded-xl border bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : "border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100"
          }`}
        />

        <button
          type="button"
          onClick={
            onToggleVisibility
          }
          disabled={
            disabled
          }
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-pink-600 disabled:cursor-not-allowed"
        >
          {visible ? (
            <EyeOff
              size={19}
            />
          ) : (
            <Eye
              size={19}
            />
          )}
        </button>
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}