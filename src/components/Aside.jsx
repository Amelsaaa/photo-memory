// === src/app/components/Aside.jsx ===
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Aside({ title, menuItems = [], user, className = "" }) {
  const pathname = usePathname();
  return (
    <aside
      className={`w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col sticky top-16 h-[calc(100vh-4rem)] ${className}`}
    >
      {title && (
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Panel manajemen
          </p>
        </div>
      )}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm ring-1 ring-blue-100/50" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              {item.icon && (
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                {user.username}
                {user.isAdmin && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 truncate font-medium">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
