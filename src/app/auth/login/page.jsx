"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Form from "@/components/Form";
import Button from "@/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message === "Invalid login credentials")
          setError("Email atau password yang kamu masukkan salah.");
        else if (error.message === "Email not confirmed")
          setError("Email belum diverifikasi. Silakan cek inbox kamu.");
        else setError(error.message);
      } else {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_admin, totp_enabled")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profileData?.is_admin) {
          if (profileData.totp_enabled) router.push("/2fa/verify");
          else router.push("/2fa/setup");
        } else router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "email profile",
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setError("Gagal login dengan Google: " + error.message);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 ring-1 ring-black/5">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Masuk untuk melanjutkan ke Photo Memory
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogleLogin}
          isLoading={isGoogleLoading}
          className="w-full mb-6 flex items-center justify-center gap-3 !rounded-xl"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-bold">Masuk dengan Google</span>
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/80 backdrop-blur-sm text-gray-500 rounded-full font-semibold ring-1 ring-gray-100">
              atau
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Form
            label="Email"
            type="email"
            name="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isGoogleLoading}
          />
          <Form
            label="Password"
            type="password"
            name="password"
            placeholder="Masukkan password kamu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isGoogleLoading}
          />
          {error && (
            <div className="bg-red-50/50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full !rounded-xl"
            disabled={isGoogleLoading}
          >
            Masuk
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6 font-medium">
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Daftar di sini
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-semibold">
            <span className="font-extrabold text-gray-500">Info UAS:</span>{" "}
            Login sebagai Admin untuk mengakses fitur Takedown.
          </p>
        </div>
      </div>
    </div>
  );
}
