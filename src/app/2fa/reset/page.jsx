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

  const handleDisable = async () => {
    if (!confirm("Nonaktifkan 2FA? Akun Anda akan kurang aman.")) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ totp_secret: null, totp_enabled: false })
        .eq("id", user.id);
      if (error) throw error;
      sessionStorage.removeItem(`2fa_verified_${user.id}`);
      alert("✅ 2FA berhasil dinonaktifkan.");
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

  const handleEnable = () => {
    router.push("/2fa/setup");
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    // 🎨 UI UPDATE: Background gradien halus
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 🎨 UI UPDATE: Card dengan rounded-2xl dan shadow lembut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-8">
          <div className="flex items-center gap-4 mb-8">
            {/* 🎨 UI UPDATE: Ikon dengan ring putih dan shadow */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white ${profile?.totp_enabled ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gradient-to-br from-red-400 to-rose-500"}`}
            >
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
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Two-Factor Authentication
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Kelola keamanan tambahan untuk akun admin
              </p>
            </div>
          </div>

          {/* 🎨 UI UPDATE: Status card dengan rounded-xl dan shadow-inner */}
          <div
            className={`rounded-xl p-6 mb-6 border-2 shadow-inner ${profile?.totp_enabled ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Status 2FA
                </p>
                <p
                  className={`text-3xl font-extrabold tracking-tight ${profile?.totp_enabled ? "text-green-700" : "text-red-700"}`}
                >
                  {profile?.totp_enabled ? "✅ Aktif" : "❌ Tidak Aktif"}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${profile?.totp_enabled ? "bg-green-100 text-green-800 ring-1 ring-green-200" : "bg-red-100 text-red-800 ring-1 ring-red-200"}`}
              >
                {profile?.totp_enabled ? "Terlindungi" : "Rentan"}
              </div>
            </div>
          </div>

          {profile?.totp_enabled ? (
            // 🎨 UI UPDATE: Info box dengan rounded-xl
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
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
                  <p className="font-bold mb-1">2FA Sedang Aktif</p>
                  <p className="text-blue-700 leading-relaxed">
                    Setiap kali Anda login, Anda akan diminta memasukkan kode 6
                    digit dari aplikasi authenticator. Ini melindungi akun Anda
                    dari akses tidak sah.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 mb-6">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">2FA Belum Aktif</p>
                  <p className="text-amber-700 leading-relaxed">
                    Akun Anda hanya dilindungi oleh password. Aktifkan 2FA untuk
                    menambahkan lapisan keamanan ekstra dengan kode 6 digit yang
                    berubah setiap 30 detik.
                  </p>
                </div>
              </div>
            </div>
          )}

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

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight">
              Keuntungan Mengaktifkan 2FA:
            </h3>
            <ul className="space-y-3">
              {[
                "Melindungi akun dari pencurian password",
                "Kode berubah setiap 30 detik (sulit diretas)",
                "Standar keamanan enterprise-grade",
                "Mencegah akses tidak sah bahkan jika password bocor",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-gray-600 font-medium"
                >
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
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
