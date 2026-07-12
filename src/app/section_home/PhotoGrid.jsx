"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";

export default function PhotoGrid() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 9;

  // Ambil data postingan dari Supabase setiap currentPage berubah
  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    setIsLoading(true);

    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;

    // ✅ PERBAIKAN: Tambahkan filter status = 'active'
    const { data: postsData } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles (
          username
        )
      `,
      )
      .eq("status", "active") // ✅ TAMBAHKAN INI: Hanya ambil postingan aktif
      .order("created_at", { ascending: false })
      .range(from, to);

    // ✅ PERBAIKAN: Tambahkan filter status = 'active' untuk count juga
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"); // ✅ TAMBAHKAN INI: Hitung hanya postingan aktif

    if (postsData) {
      setPosts(postsData);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }

    setIsLoading(false);
  };

  // Loading State (Skeleton)
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-64 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty State
  if (posts.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Belum ada kenangan yang dibagikan
        </h3>
        <p className="text-gray-500">
          Jadilah yang pertama mengupload foto kenanganmu!
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {posts.map((post) => (
          <Card
            key={post.id}
            post={post}
            isOwner={false}
            isAdmin={false}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}