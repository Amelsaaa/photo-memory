"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Table from "@/components/Table";
import Button from "@/components/Button";
import Pagination from "@/components/Pagination";
import Form from "@/components/Form";

export default function ManagePostsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [takedownReason, setTakedownReason] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  const fetchPosts = async () => {
    setIsLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;
    let query = supabase
      .from("posts")
      .select(`*, profiles ( username )`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (searchQuery.trim())
      query = query.or(
        `caption.ilike.%${searchQuery}%,profiles.username.ilike.%${searchQuery}%`,
      );
    const { data: postsData, error, count } = await query;
    if (error) console.error("Error fetching posts:", error);
    if (postsData) {
      setPosts(postsData);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }
    setIsLoading(false);
  };

  const handleTakedownClick = (post) => {
    setSelectedPost(post);
    setTakedownReason("");
    setShowReasonModal(true);
  };

  const handleTakedownConfirm = async () => {
    if (!selectedPost) return;
    setIsProcessing(selectedPost.id);
    try {
      const { error } = await supabase.rpc("takedown_post", {
        p_post_id: selectedPost.id,
        p_reason: takedownReason.trim() || null,
      });
      if (error) throw error;
      alert("✅ Postingan berhasil di-takedown!");
      setShowReasonModal(false);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Takedown error:", error);
      alert("❌ Gagal menakedown postingan: " + error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRestore = async (post) => {
    if (
      !confirm(
        `Restore postingan dari "${post.profiles?.username || "User"}"?\n\nPostingan akan muncul kembali di halaman publik.`,
      )
    )
      return;
    setIsProcessing(post.id);
    try {
      const { error } = await supabase.rpc("restore_post", {
        p_post_id: post.id,
      });
      if (error) throw error;
      alert("✅ Postingan berhasil di-restore!");
      fetchPosts();
    } catch (error) {
      console.error("Restore error:", error);
      alert("❌ Gagal me-restore postingan: " + error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCleanup = async () => {
    if (
      !confirm(
        "Hapus permanen semua postingan yang sudah ditakedown lebih dari 30 hari?\n\nTindakan ini tidak bisa dibatalkan!",
      )
    )
      return;
    try {
      const { data: deletedUrls, error } = await supabase.rpc(
        "cleanup_old_takedowns",
      );
      if (error) throw error;
      if (deletedUrls && deletedUrls.length > 0) {
        const filePaths = deletedUrls
          .map((url) => url.split("/photo_memories/")[1])
          .filter((path) => path);
        if (filePaths.length > 0)
          await supabase.storage.from("photo_memories").remove(filePaths);
      }
      const count = deletedUrls ? deletedUrls.length : 0;
      alert(
        `✅ ${count} postingan berhasil dihapus permanen dari Database & Storage!`,
      );
      fetchPosts();
    } catch (error) {
      console.error("Cleanup error:", error);
      alert("❌ Gagal cleanup: " + error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };
  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setTimeout(() => fetchPosts(), 0);
  };

  const getDaysUntilAutoDelete = (takedownAt) => {
    if (!takedownAt) return null;
    const takedownDate = new Date(takedownAt);
    const now = new Date();
    const diffTime =
      takedownDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const columns = [
    {
      key: "image_url",
      label: "Foto",
      className: "w-24",
      render: (value) => (
        <img
          src={value}
          alt="thumb"
          className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
        />
      ),
    },
    {
      key: "caption",
      label: "Caption",
      className: "max-w-md",
      render: (value) => (
        <p className="text-sm text-gray-900 font-medium line-clamp-2">
          {value || (
            <span className="text-gray-400 italic">Tidak ada caption</span>
          )}
        </p>
      ),
    },
    {
      key: "profiles",
      label: "Pemilik",
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
            {value?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <p className="text-sm font-bold text-gray-900">
            {value?.username || "Anonim"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value, row) => {
        if (value === "active")
          return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 ring-1 ring-green-200">
              Active
            </span>
          );
        else if (value === "takedown") {
          const daysLeft = getDaysUntilAutoDelete(row.takedown_at);
          return (
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 ring-1 ring-red-200">
                Takedown
              </span>
              {daysLeft !== null && (
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {daysLeft > 0 ? `${daysLeft} hari lagi` : "Akan dihapus"}
                </p>
              )}
            </div>
          );
        }
        return null;
      },
    },
    {
      key: "created_at",
      label: "Tanggal",
      render: (value) => (
        <p className="text-sm text-gray-600 font-medium">
          {new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      ),
    },
  ];

  const renderActions = (row) => {
    if (row.status === "active")
      return (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleTakedownClick(row)}
          isLoading={isProcessing === row.id}
          disabled={isProcessing !== null}
        >
          Takedown
        </Button>
      );
    else if (row.status === "takedown")
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleRestore(row)}
          isLoading={isProcessing === row.id}
          disabled={isProcessing !== null}
        >
          Restore
        </Button>
      );
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Kelola Postingan
          </h1>
          <p className="text-gray-600 mt-1 font-medium">
            Kelola postingan dengan sistem takedown sementara
          </p>
        </div>
        <Button variant="outline" onClick={handleCleanup}>
          Cleanup (30 hari)
        </Button>
      </div>

      {/* 🎨 UI UPDATE: Filter card dengan glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            {[
              { label: "Semua", val: "all", color: "blue" },
              { label: "Active", val: "active", color: "green" },
              { label: "Takedown", val: "takedown", color: "red" },
            ].map((btn) => (
              <button
                key={btn.val}
                onClick={() => {
                  setStatusFilter(btn.val);
                  setCurrentPage(1);
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${statusFilter === btn.val ? `bg-${btn.color}-600 text-white shadow-md shadow-${btn.color}-500/20` : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <div className="flex-1">
              <Form
                type="text"
                name="search"
                placeholder="Cari caption atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary">
              Cari
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSearch}
              >
                Reset
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* 🎨 UI UPDATE: Table card dengan rounded-2xl */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Daftar Postingan{" "}
            {statusFilter !== "all" && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Filter: {statusFilter})
              </span>
            )}
          </h2>
          <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>
        <Table
          columns={columns}
          data={posts}
          actions={renderActions}
          isLoading={isLoading}
          emptyMessage="Tidak ada postingan ditemukan."
        />
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
        <div className="flex gap-3">
          <svg
            className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
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
            <p className="font-bold mb-2">Sistem Takedown Sementara</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 font-medium">
              <li>
                <strong>Takedown:</strong> Postingan disembunyikan dari publik,
                tapi masih bisa di-restore.
              </li>
              <li>
                <strong>Restore:</strong> Mengembalikan postingan ke publik.
              </li>
              <li>
                <strong>Auto-delete:</strong> Postingan yang ditakedown lebih
                dari 30 hari akan dihapus permanen.
              </li>
              <li>
                <strong>Cleanup:</strong> Klik tombol "Cleanup" untuk menghapus
                manual yang sudah 30 hari.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🎨 UI UPDATE: Modal dengan glassmorphism dan rounded-3xl */}
      {showReasonModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Alasan Takedown
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Postingan dari{" "}
                <strong>{selectedPost.profiles?.username}</strong> akan
                disembunyikan dari publik.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <Form
                label="Alasan (Opsional)"
                type="textarea"
                name="reason"
                placeholder="Contoh: Melanggar aturan komunitas, konten tidak pantas, dll."
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value)}
                rows={3}
              />
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium">
                  <strong>Info:</strong> Postingan akan otomatis dihapus
                  permanen setelah 30 hari jika tidak di-restore.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedPost(null);
                }}
                className="flex-1"
                disabled={isProcessing !== null}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleTakedownConfirm}
                isLoading={isProcessing === selectedPost.id}
                className="flex-1"
              >
                Takedown Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
