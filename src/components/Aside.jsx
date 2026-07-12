"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Aside({ title, menuItems = [], user, className = "" }) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 flex flex-col sticky top-16 h-[calc(100vh-4rem)] ${className}`}
    >
      {/* 1. Header / Title */}
      {title && (
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-500 mt-1">Panel manajemen</p>
        </div>
      )}

      {/* 2. Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          // Logika untuk menandai link yang sedang aktif
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={index}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              {/* Ikon (Bisa diisi komponen SVG dari luar) */}
              {item.icon && (
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. User Profile Footer (Opsional) */}
      {user && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            {/* Avatar Inisial */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                {user.username}
                {/* Badge Admin otomatis muncul jika user adalah admin */}
                {user.isAdmin && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
