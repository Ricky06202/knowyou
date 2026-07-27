import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api";
import ContentCard from "../components/ContentCard";

export default function GalleryScreen({ params, onDetail }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(params?.category || "games");

  const categories = [
    { key: "games", label: "Juegos", icon: "🎮" },
    { key: "movies", label: "Pelis", icon: "🎬" },
    { key: "series", label: "Series", icon: "📺" },
    { key: "anime", label: "Anime", icon: "⛩️" },
  ];

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/library?category=${activeCategory}`, { token });
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [activeCategory, token, params?._refresh]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 shrink-0" style={{ paddingTop: "calc(16px + var(--safe-top))" }}>
        <h1 className="text-xl font-bold mb-3">Mi Galería</h1>
        <div className="flex gap-2 mb-3">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-900 text-gray-400 border border-gray-800"
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-gray-500 text-sm">Tu galería está vacía</p>
            <p className="text-gray-600 text-xs mt-1">
              Explora y agrega contenido que te guste
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <ContentCard
                key={item.id}
                item={{ ...item, libraryId: item.id }}
                onClick={(i) => onDetail(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
