"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/Button";

// ✅ PENTING: Terima prop 'onUploadClick' dari page.js
export default function HeroSection({ onUploadClick }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. AUTH GUARD: Cek status login saat komponen pertama kali di-render
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log(
        "[HeroSection] Session check:",
        session?.user ? "Logged in" : "Not logged in",
      );

      if (!session) {
        console.log("[HeroSection] No session, redirecting to login...");
        router.push("/auth/login");
      } else {
        setUser(session.user);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // 2. Tampilkan Loading Spinner saat sedang mengecek auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 3. Jika user null, return null
  if (!user) return null;

  // 4. Tampilkan Hero Section jika user sudah login
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Selamat Datang di Photo Memory!
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Tempat terbaik untuk mengabadikan dan membagikan momen berharga
          bersama orang-orang tersayang.
        </p>

        {/* ✅ PENTING: Tambahkan onClick={onUploadClick} di sini */}
        <Button
          onClick={onUploadClick}
          variant="secondary"
          size="lg"
          className="bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-lg"
        >
          Upload Kenangan Baru
        </Button>
      </div>
    </section>
  );
}
