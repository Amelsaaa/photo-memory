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
      color: {
        dark: "#1e40af",
        light: "#ffffff",
      },
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
        .update({
          totp_secret: secret,
          totp_enabled: true,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setIsSuccess(true);

      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err) {
      // ✅ PERBAIKAN: Tampilkan detail error asli dari Supabase di Console
      console.error("Verify error detail:", err);

      // ✅ PERBAIKAN: Ambil pesan error asli. Jika tidak ada, baru gunakan pesan default
      const errorMsg = err.message || "Terjadi kesalahan sistem.";
      console.error("Pesan error untuk user:", errorMsg);

      // ✅ PERBAIKAN: Tampilkan pesan error asli ke UI agar user (dan Anda) tahu masalahnya
      setError(errorMsg);
      setIsVerifying(false);
    }
  };

  const handleCancel = async () => {
    if (confirm("Batalkan setup 2FA? Anda bisa mengaktifkannya nanti.")) {
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Mempersiapkan setup 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
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
            <h1 className="text-3xl font-bold text-gray-900">
              Aktivasi Two-Factor Authentication
            </h1>
            <p className="text-gray-500 mt-2">
              Langkah tambahan untuk mengamankan akun admin Anda
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                2FA Berhasil Diaktifkan!
              </h2>
              <p className="text-gray-600">Mengalihkan ke dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Scan QR Code
                  </h2>
                </div>

                <p className="text-gray-600 mb-4">
                  Buka aplikasi <strong>Google Authenticator</strong>,{" "}
                  <strong>Authy</strong>, atau <strong>1Password</strong> di HP
                  Anda, lalu scan QR code:
                </p>

                <div className="flex justify-center mb-4">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code 2FA"
                      className="border-4 border-gray-100 rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-[280px] h-[280px] bg-gray-100 rounded-xl animate-pulse"></div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Tidak bisa scan?</strong> Masukkan kode ini manual:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono break-all">
                      {secret}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        alert("Kode disalin!");
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Verifikasi Kode
                  </h2>
                </div>

                <p className="text-gray-600 mb-4">
                  Masukkan kode 6 digit dari aplikasi authenticator:
                </p>

                <OTPInput
                  length={6}
                  onComplete={handleVerify}
                  disabled={isVerifying || isSuccess}
                />

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
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
                  <p className="text-center text-sm text-blue-600 mt-4">
                    Memverifikasi kode...
                  </p>
                )}
              </div>

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
                    <p className="font-semibold mb-1">Penting!</p>
                    <p className="text-blue-700">
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
