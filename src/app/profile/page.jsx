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

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, is_admin")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  };

  useEffect(() => {
    if (user) fetchMyPosts();
  }, [user, currentPage]);

  const fetchMyPosts = async () => {
    setIsLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;
    const { data: postsData, error } = await supabase
      .from("posts")
      .select(`*, profiles ( username )`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) {
      console.error("Gagal mengambil postingan saya:", error.message);
      setIsLoading(false);
      return;
    }
    const { count, error: countError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError)
      console.error("Gagal menghitung postingan:", countError.message);
    if (postsData) {
      setPosts(postsData);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    }
    setIsLoading(false);
  };

  const handleEdit = (post) => setEditingPost(post);

  const handleDelete = async (post) => {
    if (confirm("Apakah kamu yakin ingin menghapus postingan ini?")) {
      const imagePath = post.image_url.split("/photo_memories/")[1];
      if (imagePath)
        await supabase.storage.from("photo_memories").remove([imagePath]);
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) {
        alert("Gagal menghapus postingan.");
        console.error(error);
      } else {
        alert("Postingan berhasil dihapus!");
        fetchMyPosts();
      }
    }
  };

  if (isLoading || !profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-extrabold shadow-xl shadow-blue-500/20 ring-4 ring-white">
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                {profile.username || "User"}
                {profile.is_admin && (
                  <span className="text-xs bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-3 py-1 rounded-full font-bold ring-1 ring-amber-200">
                    Admin
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1 font-medium">{user?.email}</p>
              <p className="text-sm text-gray-600 mt-2 font-semibold bg-gray-100/50 inline-block px-3 py-1 rounded-full">
                {posts.length > 0
                  ? `${posts.length} kenangan telah dibagikan`
                  : "Belum ada kenangan yang dibagikan"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-8 tracking-tight">
          Postingan Saya
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
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
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-6"
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
            <h3 className="text-2xl font-extrabold text-gray-700 mb-2 tracking-tight">
              Belum ada postingan
            </h3>
            <p className="text-gray-500 mb-8 font-medium">
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

        {!isLoading && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  post={post}
                  isOwner={true}
                  isAdmin={profile.is_admin}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <EditModal
        isOpen={editingPost !== null}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onEditSuccess={() => {
          setEditingPost(null);
          fetchMyPosts();
        }}
      />
    </div>
  );
}
