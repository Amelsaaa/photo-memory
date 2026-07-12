"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Memproses login...");

  // ✅ ======================================================================
  // ✅ TAMBAHAN BARU: Fungsi untuk menentukan tujuan redirect berdasarkan role & 2FA
  // ✅ Fungsi ini meniru logika yang ada di login/page.jsx agar konsisten
  // ✅ ======================================================================
  const determineRedirectPath = async (userId) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin, totp_enabled")
      .eq("id", userId)
      .maybeSingle();

    // Jika user adalah admin
    if (profileData?.is_admin) {
      if (profileData.totp_enabled) {
        return "/2fa/verify"; // Admin yang sudah aktifkan 2FA -> minta kode
      } else {
        return "/2fa/setup"; // Admin yang belum aktifkan 2FA -> setup QR
      }
    }

    // Jika user biasa
    return "/";
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // === KASUS 1: Cek apakah ada error di URL ===
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (errorParam) {
          setStatus("Error: " + (errorDescription || errorParam));
          setTimeout(
            () =>
              router.push(
                "/auth/login?error=" +
                  encodeURIComponent(errorDescription || errorParam),
              ),
            2000,
          );
          return;
        }

        // === KASUS 2: Implicit Flow (ada #access_token= di URL) ===
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          setStatus("Memproses token...");

          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error("Set session error:", error);
              setStatus("Gagal login: " + error.message);
              setTimeout(
                () => router.push("/auth/login?error=session_failed"),
                2000,
              );
              return;
            }

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              console.error("Session tidak tersimpan setelah setSession");
              setStatus("Session tidak tersimpan. Mencoba ulang...");
              setTimeout(
                () => router.push("/auth/login?error=session_not_saved"),
                2000,
              );
              return;
            }

            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );

            // ✅ ======================================================================
            // ✅ PERUBAHAN: Ambil data user yang baru login, lalu tentukan URL tujuannya
            // ✅ ======================================================================
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const redirectPath = await determineRedirectPath(user.id);

            setStatus("Login berhasil! Mengalihkan...");
            setTimeout(() => router.push(redirectPath), 500); // ✅ DIUBAH: dari "/" menjadi redirectPath
            return;
          }
        }

        // === KASUS 3: PKCE Flow (ada ?code= di URL) - Fallback ===
        const code = urlParams.get("code");
        if (code) {
          setStatus("Menukar kode otorisasi...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Exchange code error:", error);
            setStatus("Gagal login: " + error.message);
            setTimeout(
              () => router.push("/auth/login?error=exchange_failed"),
              2000,
            );
            return;
          }

          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            console.error("Session tidak tersimpan setelah exchange code");
            setStatus("Session tidak tersimpan. Mencoba ulang...");
            setTimeout(
              () => router.push("/auth/login?error=session_not_saved"),
              2000,
            );
            return;
          }

          // ✅ ======================================================================
          // ✅ PERUBAHAN: Ambil data user yang baru login, lalu tentukan URL tujuannya
          // ✅ ======================================================================
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const redirectPath = await determineRedirectPath(user.id);

          setStatus("Login berhasil! Mengalihkan...");
          setTimeout(() => router.push(redirectPath), 500); // ✅ DIUBAH: dari "/" menjadi redirectPath
          return;
        }

        // === KASUS 4: Tidak ada parameter apapun ===
        setStatus("Parameter tidak valid. Mengalihkan ke login...");
        setTimeout(() => router.push("/auth/login"), 2000);
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("Terjadi kesalahan sistem.");
        setTimeout(() => router.push("/auth/login"), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700 font-medium">{status}</p>
      </div>
    </div>
  );
}
