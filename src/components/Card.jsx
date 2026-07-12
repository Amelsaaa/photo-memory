"use client";

export default function Card({ post, isOwner, isAdmin, onEdit, onDelete }) {
  const deleteLabel = isOwner ? "Hapus Postingan" : "Takedown";
  const showActions = isOwner || isAdmin;
  const formattedDate = new Date(post.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col max-w-sm w-full border border-gray-100 hover:border-gray-200 group">
      <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
        <img
          src={post.image_url}
          alt={post.caption || "Photo Memory"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isOwner && (
          <span className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Milikmu
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-gray-800 truncate">
            {post.profiles?.username || "Anonim"}
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {formattedDate}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3 leading-relaxed">
          {post.caption || "Tidak ada caption."}
        </p>

        {showActions && (
          <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
            {isOwner && (
              <button
                onClick={() => onEdit(post)}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm py-2.5 px-3 rounded-xl transition-all duration-200 active:scale-95"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => onDelete(post)}
              className={`flex-1 font-semibold text-sm py-2.5 px-3 rounded-xl transition-all duration-200 active:scale-95 ${isOwner ? "bg-red-50 hover:bg-red-100 text-red-600" : "bg-amber-50 hover:bg-amber-100 text-amber-700"}`}
            >
              {deleteLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
