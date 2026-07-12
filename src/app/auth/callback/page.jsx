"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Memproses login...");

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

          // Parse hash fragment menjadi object
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            // Set session manual menggunakan token dari Google
            const { data, error } = await supabase.auth.setSession({
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

            // Verifikasi session benar-benar tersimpan
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

            // Bersihkan hash dari URL agar tidak ada token yang tertinggal
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );

            setStatus("Login berhasil! Mengalihkan...");
            setTimeout(() => router.push("/"), 500);
            return;
          }
        }

        // === KASUS 3: PKCE Flow (ada ?code= di URL) - Fallback ===
        const code = urlParams.get("code");
        if (code) {
          setStatus("Menukar kode otorisasi...");
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Exchange code error:", error);
            setStatus("Gagal login: " + error.message);
            setTimeout(
              () => router.push("/auth/login?error=exchange_failed"),
              2000,
            );
            return;
          }

          // Verifikasi session benar-benar tersimpan
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

          setStatus("Login berhasil! Mengalihkan...");
          setTimeout(() => router.push("/"), 500);
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
  }, [router]); // ✅ Fixed: router adalah dependency yang stable

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700 font-medium">{status}</p>
      </div>
    </div>
  );
}
