"use client";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) {
  // Jika hanya ada 1 halaman atau kurang, jangan render apa-apa
  if (totalPages <= 1) return null;

  // Logika untuk menentukan nomor halaman mana yang harus ditampilkan
  const getVisiblePages = () => {
    // Jika total halaman sedikit (<= 7), tampilkan semua
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Jika sedang di halaman awal (1, 2, 3)
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    // Jika sedang di halaman akhir
    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // Jika sedang di halaman tengah
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  // Class untuk tombol halaman
  const pageBtnClass = (isActive) =>
    `min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  // Class untuk tombol Prev/Next
  const navBtnClass =
    "h-9 px-3 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 ${className}`}
    >
      {/* Tombol Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={navBtnClass}
        aria-label="Go to previous page"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Nomor Halaman */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`dots-${index}`}
                className="min-w-[36px] h-9 flex items-center justify-center text-gray-400 text-sm"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              className={pageBtnClass(page === currentPage)}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Go to page ${page}`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Tombol Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={navBtnClass}
        aria-label="Go to next page"
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </nav>
  );
}
