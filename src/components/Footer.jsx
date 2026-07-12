"use client";

export default function Footer() {
  // Mengambil tahun saat ini secara dinamis untuk copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bagian Atas: Brand & Links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Kiri: Logo & Deskripsi */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
              {/* Ikon Kamera/Gambar */}
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
              Photo Memory
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs">
              Abadikan momen berharga dan bagikan kenangan indahmu bersama
              dunia.
            </p>
          </div>

          {/* Kanan: Quick Links */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm font-medium text-gray-600">
            <a href="/" className="hover:text-blue-600 transition-colors">
              Beranda
            </a>
            <a href="/about" className="hover:text-blue-600 transition-colors">
              Tentang
            </a>
            <a
              href="/contact"
              className="hover:text-blue-600 transition-colors"
            >
              Kontak
            </a>
          </div>
        </div>

        {/* Divider (Garis Pemisah) */}
        <div className="border-t border-gray-200 mt-6 pt-6">
          <p className="text-center text-xs text-gray-400">
            &copy; {currentYear} Photo Memory. Dibuat untuk UAS BaaS. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
