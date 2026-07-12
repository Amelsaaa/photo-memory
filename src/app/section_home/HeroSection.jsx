"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/Button";

export default function HeroSection({ onUploadClick }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) router.push("/auth/login");
      else setUser(session.user);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  if (!user) return null;

  return (
    <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-24 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
          Selamat Datang di Photo Memory!
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
          Tempat terbaik untuk mengabadikan dan membagikan momen berharga
          bersama orang-orang tersayang.
        </p>

        <Button
          onClick={onUploadClick}
          variant="secondary"
          size="lg"
          className="!bg-white !text-blue-600 hover:!bg-gray-50 font-bold shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300"
        >
          Upload Kenangan Baru
        </Button>
      </div>
    </section>
  );
}
