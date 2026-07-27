import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api";

const CATEGORIES = [
  { key: "games", label: "Juegos", icon: "🎮" },
  { key: "movies", label: "Películas", icon: "🎬" },
  { key: "series", label: "Series", icon: "📺" },
  { key: "anime", label: "Anime", icon: "⛩️" },
];

const BADGE_COLORS = {
  games: "bg-indigo-500 text-white",
  movies: "bg-pink-500 text-white",
  series: "bg-blue-500 text-white",
  anime: "bg-purple-500 text-white",
};

const BORDER_COLORS = {
  games: "border-indigo-600/40",
  movies: "border-pink-600/40",
  series: "border-blue-600/40",
  anime: "border-purple-600/40",
};

export default function HomeScreen({ onNavigate, onDetail }) {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadPage = useCallback(async (pageNum, append) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!append) setLoading(true);
    setLoadingMore(append);
    setError(null);
    try {
      const d = await apiFetch(`/trending?category=mixed&page=${pageNum}`, { token });
      if (append) {
        setData((prev) => {
          if (!prev) return d;
          return {
            games: [...(prev.games || []), ...(d.games || [])],
            movies: [...(prev.movies || []), ...(d.movies || [])],
            series: [...(prev.series || []), ...(d.series || [])],
            anime: [...(prev.anime || []), ...(d.anime || [])],
            hasMore: d.hasMore,
            page: d.page,
          };
        });
      } else {
        setData(d);
      }
      hasMoreRef.current = d.hasMore || false;
      setHasMore(d.hasMore || false);
    } catch (err) {
      if (!append) setError(err.message || "Error al cargar contenido");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (loadingRef.current || !hasMoreRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight + 200) return;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        loadPage(nextPage, true);
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loadPage]);

  const allItems = [];
  if (data) {
    const lists = [data.games || [], data.movies || [], data.series || [], data.anime || []];
    const maxLen = Math.max(...lists.map((l) => l.length));
    for (let i = 0; i < maxLen; i++) {
      for (const list of lists) {
        if (list[i]) allItems.push(list[i]);
      }
    }
  }

  const renderItem = (item, i) => {
    const cat = item.category || "games";
    const title = item.title;
    const displayTitle = typeof title === "object" ? (title?.english || title?.romaji || "Unknown") : title;
    const heightClass = i % 3 === 0 ? "h-44" : i % 3 === 1 ? "h-40" : "h-48";

    return (
      <button
        key={item.externalId || item.id || i}
        onClick={() => onDetail(item)}
        className={`mb-2 w-full break-inside-avoid bg-gray-900 border ${BORDER_COLORS[cat] || "border-gray-800"} rounded-2xl overflow-hidden text-left active:opacity-80 transition-opacity`}
      >
        <div className={`w-full ${heightClass} bg-gray-800 relative`}>
          {item.image ? (
            <img src={item.image} alt={displayTitle} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">
              {CATEGORIES.find((c) => c.key === cat)?.icon || "?"}
            </div>
          )}
          <span className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${BADGE_COLORS[cat] || "bg-gray-700 text-gray-300"}`}>
            {CATEGORIES.find((c) => c.key === cat)?.label || cat}
          </span>
        </div>
        <div className="p-2.5">
          <p className="text-white text-xs font-medium leading-snug line-clamp-2">{displayTitle}</p>
          {item.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.genres.slice(0, 2).map((g) => (
                <span key={g} className="text-[9px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded-md">{g}</span>
              ))}
            </div>
          )}
          {item.rating != null && item.rating > 0 && (
            <p className="text-yellow-500/80 text-[10px] mt-1">★ {item.rating}</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div ref={scrollRef} className="flex flex-col h-full overflow-y-auto">
      <div className="px-4" style={{ paddingTop: "calc(16px + var(--safe-top))" }}>
        <h1 className="text-xl font-bold mb-1">
          Hola, <span className="text-indigo-400">{user?.name}</span> 👋
        </h1>
        <p className="text-gray-500 text-sm mb-4">¿Qué te recomiendo hoy?</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onNavigate("gallery", { category: cat.key })}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-left active:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="text-white font-medium mt-2 text-sm">{cat.label}</p>
              <p className="text-gray-500 text-xs">Ver mi galería →</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => onNavigate("explore")}
            className="bg-indigo-600/20 border border-indigo-600/30 rounded-xl py-2.5 text-center text-indigo-400 text-sm font-medium active:bg-indigo-600/30 transition-colors"
          >
            🔍 Explorar
          </button>
          <button
            onClick={() => onNavigate("chat")}
            className="bg-purple-600/20 border border-purple-600/30 rounded-xl py-2.5 text-center text-purple-400 text-sm font-medium active:bg-purple-600/30 transition-colors"
          >
            💬 Preguntar a la IA
          </button>
        </div>

        <div className="mb-2">
          <h2 className="text-base font-semibold mb-3">Para ti</h2>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={() => { pageRef.current = 1; loadPage(1, false); }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl active:bg-indigo-500"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="columns-3 gap-2">
              {allItems.map((item, i) => renderItem(item, i))}
            </div>
          )}
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="pb-4" />
      </div>
    </div>
  );
}
