export default function ContentCard({ item, onClick }) {
  const statusColors = {
    queued: "bg-gray-700 text-gray-300",
    playing: "bg-green-900/50 text-green-400",
    watching: "bg-blue-900/50 text-blue-400",
    completed: "bg-indigo-900/50 text-indigo-400",
    dropped: "bg-red-900/50 text-red-400",
    disliked: "bg-red-900/50 text-red-400",
  };

  const statusLabels = {
    queued: "En espera",
    playing: "Jugando",
    watching: "Viendo",
    completed: "Completado",
    dropped: "Abandonado",
    disliked: "No me gusta",
  };

  const genres = item.genres || [];

  return (
    <button
      onClick={() => onClick?.(item)}
      className="flex gap-3 w-full bg-gray-900 border border-gray-800 rounded-2xl p-3 text-left active:bg-gray-800 transition-colors"
    >
      <div className="w-16 h-22 rounded-xl bg-gray-800 shrink-0 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">
            ?
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-white font-medium text-sm truncate">{item.title}</p>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded-md"
              >
                {g}
              </span>
            ))}
          </div>
        )}
        {item.status && (
          <span
            className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-md w-fit ${statusColors[item.status] || statusColors.queued}`}
          >
            {statusLabels[item.status] || item.status}
          </span>
        )}
        {item.progress != null && item.totalEpisodes && (
          <p className="text-gray-600 text-[10px] mt-1">
            Ep {item.progress}/{item.totalEpisodes}
          </p>
        )}
        {item.hoursPlayed != null && (
          <p className="text-gray-600 text-[10px] mt-1">
            {item.hoursPlayed}h jugadas
          </p>
        )}
      </div>
    </button>
  );
}
