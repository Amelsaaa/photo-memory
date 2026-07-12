import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Photo Memory - UAS BaaS",
  description:
    "Aplikasi berbagi foto kenangan menggunakan Supabase (Backend as a Service)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* Terapkan font Inter dan background abu-abu muda secara global */}
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}
      >
        {/* Wrapper Flexbox: Memastikan Footer selalu di bawah meski konten sedikit */}
        <div className="min-h-screen flex flex-col">
          {/* Navbar akan muncul di semua halaman */}
          <Navbar />

          {/* Area Konten Utama (Halaman akan di-render di sini) */}
          <main className="flex-grow">{children}</main>

          {/* Footer akan muncul di semua halaman */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
