"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Aside from "@/components/Aside";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Jika tidak ada session, lempar ke login
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUser(session.user);

    // ✅ PERBAIKAN 1: Hapus 'totp_enabled' dari select
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("username, is_admin") // Hanya ambil username dan is_admin
      .eq("id", session.user.id)
      .maybeSingle();

    // ✅ PERBAIKAN 2: Tangani error jika query gagal (misal: RLS block)
    if (error) {
      console.error("Error fetching profile:", error.message);
      alert("Terjadi kesalahan saat memuat data profil.");
      router.push("/");
      return;
    }

    // Cek apakah user adalah admin
    if (!profileData?.is_admin) {
      alert("Akses ditolak! Halaman ini hanya untuk admin.");
      router.push("/");
      return;
    }

    setProfile(profileData);

    // ✅ PERBAIKAN 3: HAPUS SEMUA LOGIKA REDIRECT 2FA (totp_enabled)
    // Karena kita ingin langsung masuk dashboard, kita cukup set loading ke false.

    setIsLoading(false); // Ini akan me-render halaman admin
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: "Kelola Postingan",
      href: "/admin/posts",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "Reset 2FA",
      href: "/2fa/reset",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Aside
        title="Admin Panel"
        menuItems={menuItems}
        user={{
          username: profile?.username || "Admin",
          email: user?.email || "",
          isAdmin: true,
        }}
      />

      <div className="flex-1 overflow-auto">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
