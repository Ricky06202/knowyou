import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
          <span className="text-3xl font-black text-white">K</span>
        </div>

        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          KnowYou
        </h1>
        <p className="text-gray-500 text-sm mb-10">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} className="w-full grid gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 transition-colors"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 transition-colors"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-950/50 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-gray-600 text-sm mt-8">
          ¿No tienes cuenta?{" "}
          <button onClick={onSwitch} className="text-indigo-400 font-medium">
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}
