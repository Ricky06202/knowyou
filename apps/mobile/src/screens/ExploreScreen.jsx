import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api";

const MODES = [
  { key: "recommended", label: "Recomendados" },
  { key: "explore", label: "Explorar" },
];

const CATEGORIES = [
  { key: "games", label: "Juegos", icon: "🎮" },
  { key: "movies", label: "Pelis", icon: "🎬" },
  { key: "series", label: "Series", icon: "📺" },
  { key: "anime", label: "Anime", icon: "⛩️" },
];

const GENRES_BY_CATEGORY = {
  games: ["RPG", "Acción", "Aventura", "Estrategia", "Shooter", "Deportes", "Carreras", "Lucha", "Simulación", "Puzzle", "Terror", "Indie", "Plataformas"],
  movies: ["Acción", "Aventura", "Comedia", "Drama", "Terror", "Ciencia ficción", "Animación", "Romance", "Suspense", "Fantasía", "Misterio", "Documental"],
  series: ["Acción", "Comedia", "Drama", "Ciencia ficción", "Fantasía", "Terror", "Misterio", "Crimen", "Animación", "Romance", "Documental"],
  anime: ["Acción", "Aventura", "Comedia", "Drama", "Fantasía", "Romance", "Ciencia ficción", "Terror", "Misterio", "Psicológico", "Supernatural", "Deportes"],
};

const SEARCH_ENDPOINTS = {
  games: "/search/games",
  movies: "/search/movies",
  series: "/search/series",
  anime: "/search/anime",
};

export default function ExploreScreen({ params, onDetail }) {
  const { token } = useAuth();
  const [activeCategory, setActiveCategory] = useState(params?.category || "games");
  const [mode, setMode] = useState("explore");
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const queryRef = useRef("");
  const categoryRef = useRef(activeCategory);
  const modeRef = useRef("explore");
  const genresRef = useRef([]);

  const loadTrending = async (pageNum = 1, append = false) => {
    loadingRef.current = true;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      let path = `/trending?category=${categoryRef.current}&page=${pageNum}`;
      const g = genresRef.current;
      if (g.length > 0) path += `&genres=${g.join(",")}`;
      const data = await apiFetch(path, { token });
      setResults((prev) => append ? [...prev, ...(data.items || [])] : (data.items || []));
      hasMoreRef.current = data.hasMore || false;
      setHasMore(data.hasMore || false);
    } catch {
      if (!append) setResults([]);
      hasMoreRef.current = false;
      setHasMore(false);
    }
    loadingRef.current = false;
    setLoading(false);
    setLoadingMore(false);
  };

  const [recommendPrompt, setRecommendPrompt] = useState("");

  const loadRecommendations = async (customPrompt = "") => {
    loadingRef.current = true;
    setLoading(true);
    try {
      let path = `/recommend?category=${categoryRef.current}`;
      if (customPrompt) path += `&prompt=${encodeURIComponent(customPrompt)}`;
      const data = await apiFetch(path, { token });
      const items = (data.recommendations || []).map((r) => ({
        ...r,
        category: categoryRef.current,
        genres: r.genres || (r.genre ? [r.genre] : []),
      }));
      setResults(items);
      hasMoreRef.current = false;
      setHasMore(false);
    } catch {
      setResults([]);
      hasMoreRef.current = false;
      setHasMore(false);
    }
    loadingRef.current = false;
    setLoading(false);
  };

  const handleRecommend = (e) => {
    e.preventDefault();
    loadRecommendations(recommendPrompt);
  };

  const search = async (pageNum = 1, append = false) => {
    const q = queryRef.current.trim();
    if (!q) {
      loadContent(pageNum, append);
      return;
    }
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    loadingRef.current = true;
    try {
      const data = await apiFetch(`${SEARCH_ENDPOINTS[categoryRef.current]}?q=${encodeURIComponent(q)}&page=${pageNum}`, { token });
      setResults((prev) => append ? [...prev, ...(data.results || [])] : (data.results || []));
      hasMoreRef.current = data.hasMore || false;
      setHasMore(data.hasMore || false);
    } catch {
      if (!append) setResults([]);
      hasMoreRef.current = false;
      setHasMore(false);
    }
    loadingRef.current = false;
    setLoading(false);
    setLoadingMore(false);
  };

  const loadContent = (pageNum = 1, append = false) => {
    if (modeRef.current === "recommended") {
      loadRecommendations("");
    } else {
      loadTrending(pageNum, append);
    }
  };

  const resetAndLoad = (newPage = 1) => {
    pageRef.current = newPage;
    setPage(newPage);
    setResults([]);
    if (queryRef.current.trim()) {
      search(newPage, false);
    } else if (modeRef.current === "recommended") {
      loadRecommendations("");
    } else {
      loadContent(newPage, false);
    }
  };

  useEffect(() => {
    categoryRef.current = activeCategory;
    setSelectedGenres([]);
    genresRef.current = [];
    queryRef.current = "";
    setQuery("");
    if (modeRef.current === "recommended") {
      setResults([]);
      loadRecommendations("");
    } else {
      setResults([]);
      pageRef.current = 1;
      loadTrending(1, false);
    }
  }, [activeCategory, token]);

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    modeRef.current = newMode;
    setSelectedGenres([]);
    genresRef.current = [];
    queryRef.current = "";
    setQuery("");
    setRecommendPrompt("");
    pageRef.current = 1;
    setResults([]);
    if (newMode === "recommended") {
      loadRecommendations("");
    } else {
      loadTrending(1, false);
    }
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) => {
      const next = prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre];
      genresRef.current = next;
      return next;
    });
    queryRef.current = "";
    setQuery("");
    resetAndLoad(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    queryRef.current = query;
    resetAndLoad(1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || modeRef.current === "recommended") return;

    const handleScroll = () => {
      if (loadingRef.current || !hasMoreRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        if (queryRef.current.trim()) {
          search(nextPage, true);
        } else {
          loadTrending(nextPage, true);
        }
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [token]);

  const categoryBadge = {
    games: { label: "Juego", bg: "bg-indigo-500 text-white" },
    movies: { label: "Película", bg: "bg-pink-500 text-white" },
    series: { label: "Serie", bg: "bg-blue-500 text-white" },
    anime: { label: "Anime", bg: "bg-purple-500 text-white" },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 shrink-0" style={{ paddingTop: "calc(16px + var(--safe-top))" }}>
        <h1 className="text-xl font-bold mb-3">Explorar</h1>

        <div className="flex p-0.5 rounded-xl bg-gray-900 border border-gray-800 mb-4">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => handleModeChange(m.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                mode === m.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); }}
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

        {mode === "explore" && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none -mx-4 px-4">
            {GENRES_BY_CATEGORY[activeCategory]?.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 border border-gray-700"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        )}

        {mode === "recommended" ? (
          <form onSubmit={handleRecommend} className="flex gap-2 mb-3">
            <input
              type="text"
              value={recommendPrompt}
              onChange={(e) => setRecommendPrompt(e.target.value)}
              placeholder="Ej: algo con buena historia, parecido a lo que me gusta..."
              className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium active:opacity-80 disabled:opacity-40"
            >
              {loading ? "..." : "Generar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar ${CATEGORIES.find((c) => c.key === activeCategory)?.label?.toLowerCase()}...`}
              className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium active:opacity-80"
            >
              🔍
            </button>
          </form>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {results.map((item, i) => {
                const badge = categoryBadge[activeCategory];

                return (
                  <button
                    key={item.externalId || item.id || i}
                    onClick={() => onDetail({
                      ...item,
                      category: activeCategory,
                      source: item.source || (activeCategory === "anime" ? "anilist" : activeCategory === "games" ? "rawg" : "tmdb"),
                    })}
                    className="mb-2 w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden text-left active:opacity-80 transition-opacity"
                  >
                    <div className="w-full h-40 bg-gray-800 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">?</div>
                      )}
                      {badge && (
                        <span className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${badge.bg}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-white text-xs font-medium leading-snug line-clamp-2">{typeof item.title === "object" ? (item.title?.english || item.title?.romaji || "Unknown") : item.title}</p>
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
              })}
            </div>
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-gray-500 text-sm">Sin resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}
