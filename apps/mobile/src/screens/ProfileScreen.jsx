import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api";

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/profile", { token })
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Cargando perfil...</div>
      </div>
    );
  }

  const categories = [
    { key: "games", label: "Videojuegos", icon: "🎮" },
    { key: "movies", label: "Peliculas", icon: "🎬" },
    { key: "series", label: "Series", icon: "📺" },
    { key: "anime", label: "Anime", icon: "⛩️" },
    { key: "kdrama", label: "K-Dramas", icon: "🇰🇷" },
  ];

  const renderChips = (items, colorClass) => {
    if (!items?.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map((item, i) => (
          <span key={i} className={`px-2.5 py-1 text-xs rounded-full ${colorClass}`}>
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0"
        style={{ paddingTop: "calc(12px + var(--safe-top))" }}
      >
        <h1 className="text-base font-semibold">Mi Perfil</h1>
        <button onClick={logout} className="text-red-400 text-sm active:opacity-70">
          Salir
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold mx-auto mb-3">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold">{user?.name}</h2>
          <p className="text-gray-500 text-xs mt-0.5">{user?.email}</p>
        </div>

        {/* Categories */}
        {categories.map((cat) => {
          const data = profile?.[cat.key] || {};
          const hasData =
            data.liked?.length || data.disliked?.length || data.genres?.length;

          return (
            <div key={cat.key} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>{cat.icon}</span>
                <h3 className="font-semibold text-sm">{cat.label}</h3>
              </div>

              {!hasData && (
                <p className="text-gray-600 text-xs mt-2">
                  Sin datos aún. Chatea para que aprenda tus gustos.
                </p>
              )}

              {data.liked?.length > 0 && (
                <div className="mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Favoritos</span>
                  {renderChips(data.liked, "bg-green-900/30 text-green-400")}
                </div>
              )}

              {data.disliked?.length > 0 && (
                <div className="mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">No me gusta</span>
                  {renderChips(data.disliked, "bg-red-900/30 text-red-400")}
                </div>
              )}

              {data.genres?.length > 0 && (
                <div className="mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Generos</span>
                  {renderChips(data.genres, "bg-indigo-900/30 text-indigo-400")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
