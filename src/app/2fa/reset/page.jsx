"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/Button";

export default function TwoFactorSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
      .select("username, is_admin, totp_enabled")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profileData?.is_admin) {
      router.push("/");
      return;
    }

    setProfile(profileData);
    setIsLoading(false);
  };

  // Fungsi untuk menonaktifkan 2FA
  const handleDisable = async () => {
    if (!confirm("Nonaktifkan 2FA? Akun Anda akan kurang aman.")) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          totp_secret: null,
          totp_enabled: false,
        })
        .eq("id", user.id);

      if (error) throw error;

      sessionStorage.removeItem(`2fa_verified_${user.id}`);

      alert("✅ 2FA berhasil dinonaktifkan.");

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("totp_enabled")
        .eq("id", user.id)
        .maybeSingle();

      setProfile((prev) => ({
        ...prev,
        totp_enabled: updatedProfile?.totp_enabled || false,
      }));
    } catch (err) {
      console.error("Disable error:", err);
      alert("❌ Gagal menonaktifkan 2FA: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fungsi untuk mengaktifkan 2FA (redirect ke setup)
  const handleEnable = () => {
    router.push("/2fa/setup");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                profile?.totp_enabled ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <svg
                className={`w-7 h-7 ${
                  profile?.totp_enabled ? "text-green-600" : "text-red-600"
                }`}
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Two-Factor Authentication
              </h1>
              <p className="text-sm text-gray-500">
                Kelola keamanan tambahan untuk akun admin
              </p>
            </div>
          </div>

          {/* Status Card */}
          <div
            className={`rounded-lg p-6 mb-6 border-2 ${
              profile?.totp_enabled
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Status 2FA
                </p>
                <p
                  className={`text-2xl font-bold ${
                    profile?.totp_enabled ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {profile?.totp_enabled ? "✅ Aktif" : "❌ Tidak Aktif"}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  profile?.totp_enabled
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {profile?.totp_enabled ? "Terlindungi" : "Rentan"}
              </div>
            </div>
          </div>

          {/* Info Box */}
          {profile?.totp_enabled ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">2FA Sedang Aktif</p>
                  <p className="text-blue-700">
                    Setiap kali Anda login, Anda akan diminta memasukkan kode 6
                    digit dari aplikasi authenticator. Ini melindungi akun Anda
                    dari akses tidak sah.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">2FA Belum Aktif</p>
                  <p className="text-yellow-700">
                    Akun Anda hanya dilindungi oleh password. Aktifkan 2FA untuk
                    menambahkan lapisan keamanan ekstra dengan kode 6 digit yang
                    berubah setiap 30 detik.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {profile?.totp_enabled ? (
              <>
                <Button
                  variant="danger"
                  onClick={handleDisable}
                  isLoading={isProcessing}
                  className="flex-1"
                >
                  Nonaktifkan 2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin")}
                  disabled={isProcessing}
                >
                  Kembali
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={handleEnable}
                  className="flex-1"
                >
                  Aktifkan 2FA
                </Button>
                <Button variant="outline" onClick={() => router.push("/admin")}>
                  Kembali
                </Button>
              </>
            )}
          </div>

          {/* Benefits List */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Keuntungan Mengaktifkan 2FA:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Melindungi akun dari pencurian password</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Kode berubah setiap 30 detik (sulit diretas)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Standar keamanan enterprise-grade</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Mencegah akses tidak sah bahkan jika password bocor</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
