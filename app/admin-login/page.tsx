import { Suspense } from "react";
import AdminLoginForm from "./AdminLoginForm";

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white px-8 py-6 shadow-lg">
        <p className="text-lg font-semibold text-gray-700">
          Loading...
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminLoginForm />
    </Suspense>
  );
}