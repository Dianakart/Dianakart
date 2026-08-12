import { Suspense } from "react";

import ResetPasswordForm from "./ResetPasswordForm";

function ResetPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <p className="font-medium text-gray-600">
        Loading...
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />

      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}