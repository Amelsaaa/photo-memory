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

  useEffect(() => {
    fetchRecentPosts();
  }, [currentPage]);

  const fetchRecentPosts = async () => {
    setIsLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = currentPage * itemsPerPage - 1;
    const { data: postsData, error } = await supabase
      .from("posts")
      .select(`*, profiles ( username )`)
      .order("created_at", { ascending: false })
      .range(from, to);
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });
    if (error) console.error("Error fetching posts:", error);
    if (postsData) {
      setRecentPosts(postsData);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }
    setIsLoading(false);
  };

  const columns = [
    {
      key: "image_url",
      label: "Foto",
      render: (value) => (
        <img
          src={value}
          alt="thumb"
          className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
        />
      ),
    },
    {
      key: "caption",
      label: "Caption",
      className: "max-w-xs",
      render: (value) => (
        <span className="text-sm text-gray-700 font-medium line-clamp-2">
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
        <p className="text-sm font-bold text-gray-900">
          {value?.username || "Anonim"}
        </p>
      ),
    },
    {
      key: "created_at",
      label: "Tanggal Upload",
      render: (value) => (
        <span className="text-sm text-gray-600 font-medium">
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
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Dashboard Admin
        </h1>
        <p className="text-gray-600 mt-1 font-medium">
          Selamat datang di panel administrasi Photo Memory
        </p>
      </div>

      {/* 🎨 UI UPDATE: Stat cards dengan hover effect dan ikon gradien */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Postingan",
            val: stats.totalPosts,
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "blue",
          },
          {
            label: "Total User",
            val: stats.totalUsers,
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
            color: "green",
          },
          {
            label: "Total Admin",
            val: stats.totalAdmins,
            icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
            color: "yellow",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  {stat.label}
                </p>
                <p className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">
                  {stat.val}
                </p>
              </div>
              {/* 🎨 UI UPDATE: Ikon dengan gradien dan shadow */}
              <div
                className={`w-14 h-14 bg-gradient-to-br from-${stat.color}-400 to-${stat.color}-600 rounded-2xl flex items-center justify-center shadow-md shadow-${stat.color}-500/20`}
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Postingan Terbaru
          </h2>
          <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>
        <Table
          columns={columns}
          data={recentPosts}
          isLoading={isLoading}
          emptyMessage="Belum ada postingan yang diupload user."
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
    </div>
  );
}
