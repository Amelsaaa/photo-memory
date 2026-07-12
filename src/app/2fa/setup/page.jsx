"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { generateTOTPSecret, generateTOTPURI, verifyTOTP } from "@/lib/totp";
import QRCode from "qrcode";
import Button from "@/components/Button";
import OTPInput from "@/components/OTPInput";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    checkAuthAndSetup();
  }, []);

  const checkAuthAndSetup = async () => {
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
      alert("Akses ditolak! Halaman ini hanya untuk admin.");
      router.push("/");
      return;
    }
    if (profileData?.totp_enabled) {
      router.push("/admin");
      return;
    }
    setProfile(profileData);
    const newSecret = generateTOTPSecret();
    setSecret(newSecret);
    const uri = generateTOTPURI(newSecret, session.user.email);
    const qrUrl = await QRCode.toDataURL(uri, {
      width: 280,
      margin: 2,
      color: { dark: "#1e40af", light: "#ffffff" },
    });
    setQrCodeUrl(qrUrl);
    setIsLoading(false);
  };

  const handleVerify = async (code) => {
    setError("");
    setIsVerifying(true);
    try {
      const isValid = verifyTOTP(secret, code);
      if (!isValid) {
        setError("Kode tidak valid. Silakan coba lagi.");
        setIsVerifying(false);
        return;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ totp_secret: secret, totp_enabled: true })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err) {
      console.error("Verify error detail:", err);
      const errorMsg = err.message || "Terjadi kesalahan sistem.";
      console.error("Pesan error untuk user:", errorMsg);
      setError(errorMsg);
      setIsVerifying(false);
    }
  };

  const handleCancel = async () => {
    if (confirm("Batalkan setup 2FA? Anda bisa mengaktifkannya nanti."))
      router.push("/");
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Mempersiapkan setup 2FA...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/20 ring-4 ring-white">
              <svg
                className="w-10 h-10 text-white"
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
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Aktivasi Two-Factor Authentication
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Langkah tambahan untuk mengamankan akun admin Anda
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg shadow-green-500/20 animate-bounce">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
                2FA Berhasil Diaktifkan!
              </h2>
              <p className="text-gray-600 font-medium">
                Mengalihkan ke dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg font-bold text-sm shadow-md">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Scan QR Code
                  </h2>
                </div>
                <p className="text-gray-600 mb-6 font-medium">
                  Buka aplikasi <strong>Google Authenticator</strong>,{" "}
                  <strong>Authy</strong>, atau <strong>1Password</strong> di HP
                  Anda, lalu scan QR code:
                </p>

                {/* 🎨 UI UPDATE: Container QR dengan efek shadow-inner (tenggelam) */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 shadow-inner">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="QR Code 2FA"
                        className="rounded-xl"
                      />
                    ) : (
                      <div className="w-[280px] h-[280px] bg-gray-100 rounded-xl animate-pulse"></div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">
                    Tidak bisa scan? Masukkan kode ini manual:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-mono break-all shadow-sm text-gray-800">
                      {secret}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        alert("Kode disalin!");
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg font-bold text-sm shadow-md">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Verifikasi Kode
                  </h2>
                </div>
                <p className="text-gray-600 mb-6 font-medium">
                  Masukkan kode 6 digit dari aplikasi authenticator:
                </p>
                <OTPInput
                  length={6}
                  onComplete={handleVerify}
                  disabled={isVerifying || isSuccess}
                />

                {error && (
                  <div className="mt-6 bg-red-50/50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
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
                  <p className="text-center text-sm text-blue-600 mt-4 font-bold animate-pulse">
                    Memverifikasi kode...
                  </p>
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
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
                    <p className="font-bold mb-1">Penting!</p>
                    <p className="text-blue-700 leading-relaxed">
                      Simpan aplikasi authenticator Anda. Jika HP hilang, Anda
                      perlu reset 2FA.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={isVerifying}
                >
                  Batal
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
