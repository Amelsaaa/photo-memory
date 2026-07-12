"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { verifyTOTP } from "@/lib/totp";
import OTPInput from "@/components/OTPInput";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, is_admin, totp_enabled, totp_secret")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profileData?.is_admin) {
      router.push("/");
      return;
    }

    if (!profileData?.totp_enabled) {
      router.push("/2fa/setup");
      return;
    }

    const twoFactorVerified = sessionStorage.getItem(
      `2fa_verified_${session.user.id}`,
    );
    if (twoFactorVerified === "true") {
      router.push("/admin");
      return;
    }

    setProfile(profileData);
    setIsLoading(false);
  };

  const handleVerify = async (code) => {
    setError("");
    setIsVerifying(true);

    try {
      const isValid = verifyTOTP(profile.totp_secret, code);

      if (!isValid) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          await supabase.auth.signOut();
          alert("Terlalu banyak percobaan gagal. Silakan login ulang.");
          router.push("/auth/login");
          return;
        }

        setError(`Kode tidak valid. Percobaan ${newAttempts}/5.`);
        setIsVerifying(false);
        return;
      }

      sessionStorage.setItem(`2fa_verified_${user.id}`, "true");
      router.push("/admin");
    } catch (err) {
      console.error("Verify error detail:", err);
      const errorMsg = err.message || "Terjadi kesalahan sistem.";
      console.error("Pesan error untuk user:", errorMsg);
      setError(errorMsg);
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Verifikasi 2 Langkah
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Masukkan kode 6 digit dari aplikasi authenticator Anda
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Login sebagai: <strong>{profile?.username}</strong>
          </p>
        </div>

        <div className="mb-6">
          <OTPInput
            length={6}
            onComplete={handleVerify}
            disabled={isVerifying}
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
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

        {isVerifying && (
          <p className="text-center text-sm text-blue-600 mb-4">
            Memverifikasi...
          </p>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-700 text-center">
            💡 Kode berubah setiap 30 detik. Pastikan waktu di HP Anda akurat.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Kembali ke halaman login
          </button>
        </div>
      </div>
    </div>
  );
}
