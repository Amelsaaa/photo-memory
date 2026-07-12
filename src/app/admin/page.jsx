"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Table from "@/components/Table";
import Pagination from "@/components/Pagination";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const itemsPerPage = 10;

  // Ambil statistik dashboard
  useEffect(() => {
    const fetchStats = async () => {
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: adminsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_admin", true);

      setStats({
        totalPosts: postsCount || 0,
        totalUsers: usersCount || 0,
        totalAdmins: adminsCount || 0,
      });
    };

    fetchStats();
  }, []);

  // Ambil postingan terbaru (HANYA UNTUK DITAMPILKAN, TANPA AKSI)
  useEffect(() => {
    fetchRecentPosts();
  }, [currentPage]);

  const fetchRecentPosts = async () => {
    setIsLoading(true);

    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;

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
      .order("created_at", { ascending: false })
      .range(from, to);

    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error fetching posts:", error);
    }

    if (postsData) {
      setRecentPosts(postsData);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }

    setIsLoading(false);
  };

  // Definisi kolom untuk Table (TANPA KOLOM AKSI)
  const columns = [
    {
      key: "image_url",
      label: "Foto",
      render: (value) => (
        <img
          src={value}
          alt="thumb"
          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
        />
      ),
    },
    {
      key: "caption",
      label: "Caption",
      className: "max-w-xs",
      render: (value) => (
        <span className="text-sm text-gray-700 line-clamp-2">
          {value || (
            <span className="text-gray-400 italic">Tidak ada caption</span>
          )}
        </span>
      ),
    },
    {
      key: "profiles",
      label: "Pemilik",
      render: (value) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {value?.username || "Anonim"}
          </p>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Tanggal Upload",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang di panel administrasi Photo Memory
        </p>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Postingan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Postingan
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalPosts}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
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
            </div>
          </div>
        </div>

        {/* Total User */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total User</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Admin</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalAdmins}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Postingan Terbaru (TANPA TOMBOL AKSI) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Postingan Terbaru</h2>
          <span className="text-sm text-gray-500">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>

        <Table
          columns={columns}
          data={recentPosts}
          isLoading={isLoading}
          emptyMessage="Belum ada postingan yang diupload user."
        />

        {/* Pagination */}
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
    </div>
  );
}
