// === src/app/section_home/PhotoGrid.jsx ===
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

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    setIsLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;
    const { data: postsData, error } = await supabase
      .from("posts")
      .select(`*, profiles ( username )`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) {
      console.error("Error fetching posts:", error.message);
      setIsLoading(false);
      return;
    }
    const { count, error: countError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    if (countError) console.error("Error counting posts:", countError.message);
    if (postsData) {
      setPosts(postsData);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    }
    setIsLoading(false);
  };

  if (isLoading)
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            // 🎨 UI UPDATE: Skeleton dengan rounded-2xl dan border halus
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-gray-100"
            >
              <div className="h-64 bg-gray-200"></div>
              <div className="p-5 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );

  if (posts.length === 0)
    return (
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        {/* 🎨 UI UPDATE: Empty state lebih modern dengan background halus */}
        <div className="max-w-md mx-auto p-8 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
          <svg
            className="w-20 h-20 mx-auto text-gray-300 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-700 mb-2 tracking-tight">
            Belum ada kenangan
          </h3>
          <p className="text-gray-500 font-medium">
            Jadilah yang pertama mengupload foto kenanganmu!
          </p>
        </div>
      </section>
    );

  return (
    // 🎨 UI UPDATE: Gap lebih besar (gap-8) agar kartu lebih bernapas
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
