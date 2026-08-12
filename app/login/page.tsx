import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Customer Login | DianaKart",
  description: "Login to your DianaKart customer account.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />

      <div className="relative z-10 flex w-full justify-center">
        <LoginForm />
      </div>
    </main>
  );
}