import { useState, useRef, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api";
import ContentCard from "../components/ContentCard";

const SUGGESTION_POOL = [
  { emoji: "🎮", text: "Recomiéndame juegos tácticos" },
  { emoji: "🎮", text: "Juegos indie que estén buenos" },
  { emoji: "🎮", text: "Juegos con buena historia" },
  { emoji: "🎮", text: "Algo para jugar en la switch" },
  { emoji: "🎮", text: "RPGs con mucho contenido" },
  { emoji: "🎬", text: "Películas de ciencia ficción" },
  { emoji: "🎬", text: "Películas que no me pueda olvidar" },
  { emoji: "🎬", text: "Algo para ver con amigos" },
  { emoji: "🎬", text: "Películas recientes que valgan la pena" },
  { emoji: "📺", text: "Series para maratonear" },
  { emoji: "📺", text: "Series con plot twists" },
  { emoji: "📺", text: "Series que estén en tendencia" },
  { emoji: "📺", text: "Series cortas pero buenas" },
  { emoji: "⛩️", text: "Anime táctico o estratégico" },
  { emoji: "⛩️", text: "Anime que me haga llorar" },
  { emoji: "⛩️", text: "Anime con acción y estrategia" },
  { emoji: "⛩️", text: "Anime buenísimo que no sea mainstream" },
  { emoji: "🇰🇷", text: "K-dramas que enganchen" },
  { emoji: "🇰🇷", text: "K-dramas de acción" },
  { emoji: "🇰🇷", text: "Series coreanas para empezar" },
  { emoji: "🎲", text: "Algo que nunca haya jugado" },
  { emoji: "🎲", text: "Recomiéndame algo sorpresa" },
  { emoji: "🎲", text: "Lo mejor del 2025" },
  { emoji: "🎲", text: "Joyas ocultas que poca gente conoce" },
];

function shuffleAndPick(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function ChatScreen({ onAdd, onDetail }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const suggestions = useMemo(() => shuffleAndPick(SUGGESTION_POOL, 4), []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const data = await apiFetch("/chat", {
        method: "POST",
        token,
        body: { message: userMsg },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.message, recommendations: data.recommendations || [] }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Hubo un error: " + err.message },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0" style={{ paddingTop: "calc(16px + var(--safe-top))" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-semibold mb-2">¿Qué te recomiendo hoy?</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Pide recomendaciones de juegos, películas, series o anime. Chatea como con un amigo.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-xs">
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  onClick={() => setInput(s.text)}
                  className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400 text-left active:bg-gray-800 active:border-gray-700 transition-colors"
                >
                  {s.emoji} {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold mr-2 mt-1 shrink-0">
                  K
                </div>
              )}
              <div
                className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "bg-gray-800 text-gray-200 rounded-bl-md"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <div className="prose-chat"><Markdown>{msg.content}</Markdown></div>
                )}
              </div>
            </div>
            {msg.role === "assistant" && msg.recommendations?.length > 0 && (
              <div className="ml-8 mt-2 space-y-2">
                {msg.recommendations.map((rec, j) => (
                  <ContentCard
                    key={j}
                    item={{
                      id: rec.externalId,
                      externalId: rec.externalId,
                      title: rec.title,
                      image: rec.image,
                      genres: rec.genres || [],
                      category: rec.category,
                      source: rec.source,
                      description: rec.description,
                      reason: rec.reason,
                      year: rec.year,
                      rating: rec.rating,
                    }}
                    onClick={onDetail}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold mr-2 mt-1 shrink-0">
              K
            </div>
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <span className="typing-dot w-2 h-2 bg-gray-500 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-gray-500 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-gray-500 rounded-full" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-3 py-2 border-t border-gray-800 shrink-0"
        style={{ paddingBottom: "calc(8px + var(--safe-bottom))" }}
      >
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 transition-colors text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white disabled:opacity-40 active:opacity-80 transition-opacity shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-5 5m5-5l5 5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
