"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Form from "@/components/Form";
import Button from "@/components/Button";

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Reset state setiap modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      setError("");
      setIsLoading(false);

      const getUser = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user);
      };
      getUser();
    }
  }, [isOpen]);

  // Handle pilih file & buat preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validasi ukuran (Maks 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal 5MB.");
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      // Validasi tipe file
      if (!selectedFile.type.startsWith("image/")) {
        setError("File harus berupa gambar (JPG, PNG, dll).");
        setFile(null);
        setPreviewUrl(null);
        return;
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Buat preview lokal
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Silakan pilih foto terlebih dahulu.");
      return;
    }

    if (!currentUser) {
      setError("Sesi login telah berakhir. Silakan refresh halaman.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate nama file yang unik agar tidak tertimpa
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      // PENTING: Path HARUS format {user_id}/namafile agar sesuai dengan RLS Storage
      const filePath = `${currentUser.id}/${fileName}`;

      // 2. Upload file ke Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("photo_memories")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Gagal upload gambar: ${storageError.message}`);
      }

      // 3. Ambil Public URL dari file yang baru diupload
      const { data: urlData } = supabase.storage
        .from("photo_memories")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // 4. Insert data postingan ke tabel 'posts' di Database
      const { error: dbError } = await supabase.from("posts").insert({
        user_id: currentUser.id,
        image_url: imageUrl,
        caption: caption.trim() || null,
      });

      if (dbError) {
        // ROLLBACK: Jika gagal simpan ke DB, hapus file di storage agar tidak jadi sampah
        await supabase.storage.from("photo_memories").remove([filePath]);
        throw new Error(`Gagal menyimpan ke database: ${dbError.message}`);
      }

      // 5. Sukses! Trigger refresh di halaman utama dan tutup modal
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Terjadi kesalahan saat mengupload foto.");
    } finally {
      setIsLoading(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Bersihkan memory preview
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Upload Kenangan Baru
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body Modal (Form) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview Gambar (Muncul jika file sudah dipilih) */}
          {previewUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                disabled={isLoading}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <Form
            label="Pilih Foto"
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            required
            disabled={isLoading}
          />

          <Form
            label="Caption (Opsional)"
            type="textarea"
            name="caption"
            placeholder="Ceritakan momen di balik foto ini..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={isLoading}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="flex-1"
            >
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
