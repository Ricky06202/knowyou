import { useState } from "react";

const STATUS_OPTIONS = {
  games: [
    { value: "queued", label: "En espera" },
    { value: "playing", label: "Jugando" },
    { value: "completed", label: "Completado" },
    { value: "dropped", label: "Abandonado" },
    { value: "disliked", label: "No me gusta" },
  ],
  movies: [
    { value: "queued", label: "En espera" },
    { value: "watching", label: "Viendo" },
    { value: "completed", label: "Visto" },
    { value: "dropped", label: "Abandonado" },
    { value: "disliked", label: "No me gusta" },
  ],
  series: [
    { value: "queued", label: "En espera" },
    { value: "watching", label: "Viendo" },
    { value: "completed", label: "Completado" },
    { value: "dropped", label: "Abandonado" },
    { value: "disliked", label: "No me gusta" },
  ],
  anime: [
    { value: "queued", label: "En espera" },
    { value: "watching", label: "Viendo" },
    { value: "completed", label: "Completado" },
    { value: "dropped", label: "Abandonado" },
    { value: "disliked", label: "No me gusta" },
  ],
};

export default function DetailModal({ item, onClose, onUpdate, onDelete, onAdd }) {
  if (!item) return null;

  const isLibraryItem = !!item.libraryId;
  const category = item.category || "games";
  const statuses = STATUS_OPTIONS[category] || STATUS_OPTIONS.games;

  const [status, setStatus] = useState(item.status || "queued");
  const [progress, setProgress] = useState(item.progress || 0);
  const [hoursPlayed, setHoursPlayed] = useState(item.hoursPlayed || 0);
  const [rating, setRating] = useState(item.rating || 0);

  const handleSave = () => {
    onUpdate?.(item.libraryId, { status, progress: Number(progress), hoursPlayed: Number(hoursPlayed), rating: Number(rating) });
    onClose();
  };

  const handleAdd = () => {
    onAdd?.({
      category,
      externalId: item.externalId || String(item.id) || "",
      source: item.source || "unknown",
      title: typeof item.title === "object" ? (item.title?.english || item.title?.romaji || "Unknown") : item.title,
      image: item.image,
      genres: item.genres || [],
      status,
      progress: Number(progress),
      hoursPlayed: Number(hoursPlayed),
      rating: Number(rating),
      data: item,
    });
    onClose();
  };

  const handleRemove = () => {
    onDelete?.(item.libraryId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-gray-950 rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(32px + var(--safe-bottom))" }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        <div className="flex gap-4 mb-5">
          <div className="w-20 h-28 rounded-xl bg-gray-800 shrink-0 overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">?</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">{item.title}</h2>
            {item.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.genres.map((g) => (
                  <span key={g} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded-md">{g}</span>
                ))}
              </div>
            )}
            {item.year && <p className="text-gray-500 text-xs mt-1">{item.year}</p>}
            {item.reason && <p className="text-gray-400 text-xs mt-2 italic">{item.reason}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Estado</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    status === s.value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {category === "games" && (
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Horas jugadas</label>
              <input
                type="number"
                value={hoursPlayed}
                onChange={(e) => setHoursPlayed(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm"
                placeholder="0"
              />
            </div>
          )}

          {(category === "series" || category === "anime") && (
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                Episodios vistos {item.totalEpisodes ? `/ ${item.totalEpisodes}` : ""}
              </label>
              <input
                type="number"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm"
                placeholder="0"
              />
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Calificación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n === rating ? 0 : n)}
                  className={`text-xl transition-colors ${n <= rating ? "text-yellow-400" : "text-gray-700"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={isLibraryItem ? handleSave : handleAdd}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 active:opacity-80 text-sm"
            >
              {isLibraryItem ? "Guardar" : "+ Agregar a mi galería"}
            </button>
            {isLibraryItem && (
              <button
                onClick={handleRemove}
                className="px-4 py-3 rounded-xl text-red-400 bg-red-950/50 text-sm"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
