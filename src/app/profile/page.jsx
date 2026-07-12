"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";
import Button from "@/components/Button";
import EditModal from "../section_home/EditModal";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);

  const itemsPerPage = 9;

  // 1. AUTH GUARD: Cek status login
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      setUser(session.user);
      fetchProfile(session.user.id);
    };

    checkAuth();
  }, [router]);

  // 2. Ambil data profil user
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, is_admin")
      .eq("id", userId)
      .maybeSingle();

    setProfile(data);
  };

  // 3. Ambil postingan milik user ini saja
  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user, currentPage]);

  const fetchMyPosts = async () => {
    setIsLoading(true);

    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;

    // ✅ PERBAIKAN 1: HAPUS .eq("status", "active") dan tangkap objek 'error'
    const { data: postsData, error } = await supabase
      .from("posts")
      .select(
        `
      *,
      profiles (
        username
      )
    `,
      )
      .eq("user_id", user.id)
      // .eq("status", "active") <-- HAPUS BARIS INI! Tabel posts tidak punya kolom status
      .order("created_at", { ascending: false })
      .range(from, to);

    // ✅ PERBAIKAN 2: Selalu cek error dari Supabase!
    if (error) {
      console.error("Gagal mengambil postingan saya:", error.message);
      setIsLoading(false);
      return; // Hentikan proses jika ada error
    }

    // ✅ PERBAIKAN 3: HAPUS .eq("status", "active") untuk count juga, dan tangkap error
    const { count, error: countError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    // .eq("status", "active") <-- HAPUS BARIS INI JUGA!

    if (countError) {
      console.error("Gagal menghitung postingan:", countError.message);
    }

    if (postsData) {
      setPosts(postsData);
      // Pastikan count tidak null sebelum dibagi
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    }

    setIsLoading(false);
  };

  // 4. Fungsi Edit
  const handleEdit = (post) => {
    setEditingPost(post);
  };

  // 5. Fungsi Hapus
  const handleDelete = async (post) => {
    if (confirm("Apakah kamu yakin ingin menghapus postingan ini?")) {
      // Hapus dari Storage
      const imagePath = post.image_url.split("/photo_memories/")[1];
      if (imagePath) {
        await supabase.storage.from("photo_memories").remove([imagePath]);
      }

      // Hapus dari Database
      const { error } = await supabase.from("posts").delete().eq("id", post.id);

      if (error) {
        alert("Gagal menghapus postingan.");
        console.error(error);
      } else {
        alert("Postingan berhasil dihapus!");
        fetchMyPosts(); // Refresh data
      }
    }
  };

  // Loading State
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profile */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Info User */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {profile.username || "User"}
                {profile.is_admin && (
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                    Admin
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1">{user?.email}</p>
              <p className="text-sm text-gray-600 mt-2">
                {posts.length > 0
                  ? `${posts.length} kenangan telah dibagikan`
                  : "Belum ada kenangan yang dibagikan"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Postingan Saya
        </h2>

        {/* Loading Skeleton */}
        {isLoading && (
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
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <svg
              className="w-20 h-20 mx-auto text-gray-300 mb-4"
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
              Belum ada postingan
            </h3>
            <p className="text-gray-500 mb-6">
              Mulai bagikan kenangan pertamamu!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/")}
            >
              Upload Kenangan Sekarang
            </Button>
          </div>
        )}

        {/* Grid Postingan */}
        {!isLoading && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  post={post}
                  isOwner={true} // Semua postingan di halaman ini pasti milik user
                  isAdmin={profile.is_admin}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={editingPost !== null}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onEditSuccess={() => {
          setEditingPost(null);
          fetchMyPosts(); // Refresh setelah edit berhasil
        }}
      />
    </div>
  );
}
