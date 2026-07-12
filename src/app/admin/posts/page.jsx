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
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, takedown
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
      .select(
        `
        *,
        profiles (
          username
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    // Filter berdasarkan status
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Filter berdasarkan search query
    if (searchQuery.trim()) {
      query = query.or(
        `caption.ilike.%${searchQuery}%,profiles.username.ilike.%${searchQuery}%`,
      );
    }

    const { data: postsData, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
    }

    if (postsData) {
      setPosts(postsData);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }

    setIsLoading(false);
  };

  // Fungsi Takedown (Buka Modal untuk alasan)
  const handleTakedownClick = (post) => {
    setSelectedPost(post);
    setTakedownReason("");
    setShowReasonModal(true);
  };

  // Fungsi Takedown (Setelah konfirmasi alasan)
  const handleTakedownConfirm = async () => {
    if (!selectedPost) return;

    setIsProcessing(selectedPost.id);

    try {
      // Panggil function database untuk takedown
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

  // Fungsi Restore
  const handleRestore = async (post) => {
    if (
      !confirm(
        `Restore postingan dari "${post.profiles?.username || "User"}"?\n\nPostingan akan muncul kembali di halaman publik.`,
      )
    ) {
      return;
    }

    setIsProcessing(post.id);

    try {
      // Panggil function database untuk restore
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

  // Fungsi Cleanup Manual (Hapus permanen yang sudah 30 hari)
  // Fungsi Cleanup Manual (Hapus permanen yang sudah 30 hari)
  const handleCleanup = async () => {
    if (
      !confirm(
        "Hapus permanen semua postingan yang sudah ditakedown lebih dari 30 hari?\n\nTindakan ini tidak bisa dibatalkan!",
      )
    ) {
      return;
    }

    try {
      // Panggil function database. Sekarang return-nya adalah array URL gambar (text[])
      const { data: deletedUrls, error } = await supabase.rpc(
        "cleanup_old_takedowns",
      );

      if (error) throw error;

      // ✅ PERBAIKAN: Hapus file fisik dari Storage agar tidak jadi sampah
      if (deletedUrls && deletedUrls.length > 0) {
        // Ekstrak path file dari URL (format: bucket_id/path)
        const filePaths = deletedUrls
          .map((url) => url.split("/photo_memories/")[1])
          .filter((path) => path); // Filter jika ada URL yang formatnya tidak sesuai

        if (filePaths.length > 0) {
          await supabase.storage.from("photo_memories").remove(filePaths);
        }
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

  // Helper untuk menghitung sisa hari sebelum auto-delete
  const getDaysUntilAutoDelete = (takedownAt) => {
    if (!takedownAt) return null;
    const takedownDate = new Date(takedownAt);
    const now = new Date();
    const diffTime =
      takedownDate.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Definisi kolom untuk Table
  const columns = [
    {
      key: "image_url",
      label: "Foto",
      className: "w-24",
      render: (value) => (
        <img
          src={value}
          alt="thumb"
          className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow-sm"
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {value?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <p className="text-sm font-medium text-gray-900">
            {value?.username || "Anonim"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value, row) => {
        if (value === "active") {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          );
        } else if (value === "takedown") {
          const daysLeft = getDaysUntilAutoDelete(row.takedown_at);
          return (
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Takedown
              </span>
              {daysLeft !== null && (
                <p className="text-xs text-gray-500 mt-1">
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
        <p className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      ),
    },
  ];

  // Render aksi untuk setiap baris
  const renderActions = (row) => {
    if (row.status === "active") {
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
    } else if (row.status === "takedown") {
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
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Postingan</h1>
          <p className="text-gray-600 mt-1">
            Kelola postingan dengan sistem takedown sementara
          </p>
        </div>
        <Button variant="outline" onClick={handleCleanup}>
          Cleanup (30 hari)
        </Button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setStatusFilter("active");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter("takedown");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "takedown"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Takedown
            </button>
          </div>

          {/* Search Bar */}
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

      {/* Tabel Postingan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Daftar Postingan
            {statusFilter !== "all" && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Filter: {statusFilter})
              </span>
            )}
          </h2>
          <span className="text-sm text-gray-500">
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <p className="font-semibold mb-1">Sistem Takedown Sementara</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
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

      {/* Modal Alasan Takedown */}
      {showReasonModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Alasan Takedown
              </h2>
              <p className="text-sm text-gray-500 mt-1">
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Info:</strong> Postingan akan otomatis dihapus
                  permanen setelah 30 hari jika tidak di-restore.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
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
