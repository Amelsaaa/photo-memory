// === src/app/section_home/EditModal.jsx ===
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Form from "@/components/Form";
import Button from "@/components/Button";

export default function EditModal({ isOpen, onClose, post, onEditSuccess }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isOpen && post) {
      setFile(null);
      setPreviewUrl(null);
      setCaption(post.caption || "");
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
  }, [isOpen, post]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal 5MB.");
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      if (!selectedFile.type.startsWith("image/")) {
        setError("File harus berupa gambar.");
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const handleCancelNewFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!post || !currentUser) {
      setError("Data postingan tidak valid.");
      return;
    }
    if (post.user_id !== currentUser.id) {
      setError("Anda tidak memiliki izin untuk mengedit postingan ini.");
      return;
    }
    setIsLoading(true);
    try {
      let newImageUrl = post.image_url;
      if (file) {
        const oldImagePath = post.image_url.split("/photo_memories/")[1];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("photo_memories")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError)
          throw new Error(`Gagal upload gambar baru: ${uploadError.message}`);
        const { data: urlData } = supabase.storage
          .from("photo_memories")
          .getPublicUrl(filePath);
        newImageUrl = urlData.publicUrl;
        if (oldImagePath)
          await supabase.storage.from("photo_memories").remove([oldImagePath]);
      }
      const { error: dbError } = await supabase
        .from("posts")
        .update({ image_url: newImageUrl, caption: caption.trim() || null })
        .eq("id", post.id)
        .eq("user_id", currentUser.id);
      if (dbError) throw new Error(`Gagal update database: ${dbError.message}`);
      onEditSuccess();
      onClose();
    } catch (err) {
      console.error("Edit error:", err);
      setError(err.message || "Terjadi kesalahan saat mengedit postingan.");
    } finally {
      setIsLoading(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 rounded-3xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Edit Postingan
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
            <img
              src={previewUrl || post.image_url}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {previewUrl && (
              <button
                type="button"
                onClick={handleCancelNewFile}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                disabled={isLoading}
                title="Batalkan gambar baru"
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
            )}
            {!previewUrl && (
              <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                Gambar saat ini
              </span>
            )}
          </div>
          <Form
            label="Ganti Foto (Opsional)"
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Form
            label="Caption"
            type="textarea"
            name="caption"
            placeholder="Ceritakan momen di balik foto ini..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
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
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
