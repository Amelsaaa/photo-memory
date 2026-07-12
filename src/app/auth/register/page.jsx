"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Form from "@/components/Form";
import Button from "@/components/Button";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Validasi Client-Side
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setError("Password harus minimal 6 karakter.");
      return;
    }
    if (!username.trim()) {
      setError("Username tidak boleh kosong.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Daftarkan user ke Supabase Auth
      // PENTING: Kirimkan username sebagai 'data' (metadata) agar Trigger database bisa menangkapnya
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError(
            "Email ini sudah terdaftar. Silakan login atau gunakan Google.",
          );
        } else {
          setError(error.message);
        }
      } else {
        // 3. Sukses! Trigger database sudah otomatis membuat profil.
        // Redirect ke halaman login dengan pesan sukses
        router.push("/auth/login?registered=true");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buat Akun Baru</h1>
          <p className="text-gray-500 mt-2">Bergabung dan bagikan kenanganmu</p>
        </div>

        {/* Info Box: Alternatif Google Login */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-800">
            Ingin lebih cepat? Kamu bisa langsung{" "}
            <Link
              href="/auth/login"
              className="font-semibold underline hover:text-blue-900"
            >
              Login dengan Google
            </Link>{" "}
            tanpa perlu mengisi form registrasi.
          </p>
        </div>

        {/* Form Register */}
        <form onSubmit={handleRegister} className="space-y-5">
          <Form
            label="Username"
            type="text"
            name="username"
            placeholder="Nama panggilan kamu"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Form
            label="Email"
            type="email"
            name="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Form
            label="Password"
            type="password"
            name="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Form
            label="Konfirmasi Password"
            type="password"
            name="confirmPassword"
            placeholder="Ulangi password kamu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {/* Error Message Box */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
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

          {/* Tombol Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            Daftar Sekarang
          </Button>
        </form>

        {/* Link ke Halaman Login */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}