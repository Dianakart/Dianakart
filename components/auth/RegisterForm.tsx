"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from "lucide-react";

type RegisterFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof RegisterFormData, string>>;

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] =
    useState<RegisterFormData>(initialFormData);

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!name) {
      newErrors.name = "Full name is required.";
    } else if (name.length < 3) {
      newErrors.name = "Name must contain at least 3 characters.";
    }

    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!phone) {
      newErrors.phone = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    } else if (!/[A-Za-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one letter.";
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    let updatedValue = value;

    if (name === "phone") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: updatedValue,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: undefined,
    }));

    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
  name: formData.name.trim(),
  email: formData.email.trim().toLowerCase(),
  phone: formData.phone.trim(),
  password: formData.password,
  confirmPassword: formData.confirmPassword,
}),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(
          result.message || result.error || "Registration failed."
        );
        return;
      }

      setSuccessMessage(
        result.message || "Account created successfully."
      );

      setFormData(initialFormData);

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);

      setServerError(
        "Unable to create your account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 px-7 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <User size={28} />
          </div>

          <h1 className="text-3xl font-bold">Create Account</h1>

          <p className="mt-2 text-sm text-white/90">
            Join DianaKart and start shopping today
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 px-6 py-7 sm:px-8"
        >
          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {serverError}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
            >
              {successMessage}
            </div>
          )}

          <InputField
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            placeholder="Enter your full name"
            autoComplete="name"
            error={errors.name}
            disabled={isLoading}
            icon={<User size={19} />}
            onChange={handleChange}
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            placeholder="Enter your email address"
            autoComplete="email"
            error={errors.email}
            disabled={isLoading}
            icon={<Mail size={19} />}
            onChange={handleChange}
          />

          <InputField
            label="Mobile Number"
            name="phone"
            type="tel"
            value={formData.phone}
            placeholder="Enter 10-digit mobile number"
            autoComplete="tel"
            inputMode="numeric"
            error={errors.phone}
            disabled={isLoading}
            icon={<Phone size={19} />}
            onChange={handleChange}
          />

          <PasswordField
            label="Password"
            name="password"
            value={formData.password}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            error={errors.password}
            disabled={isLoading}
            visible={showPassword}
            onToggleVisibility={() =>
              setShowPassword((currentValue) => !currentValue)
            }
            onChange={handleChange}
          />

          <PasswordField
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            placeholder="Enter password again"
            autoComplete="new-password"
            error={errors.confirmPassword}
            disabled={isLoading}
            visible={showConfirmPassword}
            onToggleVisibility={() =>
              setShowConfirmPassword(
                (currentValue) => !currentValue
              )
            }
            onChange={handleChange}
          />

          <p className="text-xs leading-5 text-gray-500">
            By creating an account, you agree to DianaKart&apos;s{" "}
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
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 font-semibold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin" size={20} />
                Creating Account...
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
            Already have an account?{" "}
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

type InputFieldProps = {
  label: string;
  name: keyof RegisterFormData;
  type: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  disabled: boolean;
  icon: React.ReactNode;
  inputMode?: "text" | "numeric" | "tel" | "email";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
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

type PasswordFieldProps = {
  label: string;
  name: "password" | "confirmPassword";
  value: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  disabled: boolean;
  visible: boolean;
  onToggleVisibility: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
          <LockKeyhole size={19} />
        </span>

        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-gray-50 py-3 pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : "border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-100"
          }`}
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-pink-600 disabled:cursor-not-allowed"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
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