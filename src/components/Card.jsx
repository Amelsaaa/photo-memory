"use client"; // Karena ada interaksi button (onClick)

export default function Card({ post, isOwner, isAdmin, onEdit, onDelete }) {
  // Menentukan label tombol delete berdasarkan role
  const deleteLabel = isOwner ? "Hapus Postingan" : "Takedown";
  const showActions = isOwner || isAdmin;

  // Format tanggal menjadi lebih mudah dibaca
  const formattedDate = new Date(post.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col max-w-sm w-full">
      {/* Bagian Gambar */}
      <div className="relative w-full h-64 bg-gray-100">
        <img
          src={post.image_url}
          alt={post.caption || "Photo Memory"}
          className="w-full h-full object-cover"
        />
        {/* Badge Admin/Owner (Opsional, untuk visual) */}
        {isOwner && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Milikmu
          </span>
        )}
      </div>

      {/* Bagian Konten */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Header: Username & Tanggal */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {post.profiles?.username || "Anonim"}
          </h3>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>

        {/* Caption */}
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
          {post.caption || "Tidak ada caption."}
        </p>

        {/* Action Buttons (Muncul hanya jika Owner atau Admin) */}
        {showActions && (
          <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
            {isOwner && (
              <button
                onClick={() => onEdit(post)}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm py-2 px-3 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => onDelete(post)}
              className={`flex-1 font-medium text-sm py-2 px-3 rounded-lg transition-colors ${
                isOwner
                  ? "bg-red-50 hover:bg-red-100 text-red-600"
                  : "bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
              }`}
            >
              {deleteLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
