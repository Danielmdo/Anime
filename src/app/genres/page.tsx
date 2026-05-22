import Link from "next/link";
import { AnimeGenres } from "@/lib/types";

const genreColors: Record<string, string> = {
  Acción: "from-red-600 to-orange-600",
  Aventuras: "from-emerald-600 to-teal-600",
  Comedia: "from-yellow-500 to-orange-500",
  Drama: "from-purple-600 to-indigo-600",
  Fantasía: "from-violet-600 to-purple-600",
  Romance: "from-pink-500 to-rose-500",
  Terror: "from-gray-700 to-gray-900",
  "Ciencia Ficción": "from-cyan-600 to-blue-600",
  Misterio: "from-slate-600 to-gray-700",
  Seinen: "from-orange-600 to-red-600",
  Shounen: "from-amber-500 to-red-500",
  Shoujo: "from-pink-400 to-rose-400",
  Deportes: "from-green-600 to-emerald-600",
  Música: "from-fuchsia-500 to-pink-500",
  Meccha: "from-blue-600 to-indigo-600",
};

function getGenreGradient(genre: string): string {
  return genreColors[genre] || "from-gray-700 to-gray-600";
}

function getGenreEmoji(genre: string): string {
  const emojis: Record<string, string> = {
    Acción: "⚔️",
    "Artes Marciales": "🥋",
    Aventuras: "🗺️",
    Carreras: "🏎️",
    "Ciencia Ficción": "🚀",
    Comedia: "😂",
    Demencia: "🌀",
    Demonios: "👹",
    Deportes: "🏀",
    Drama: "🎭",
    Ecchi: "🔥",
    Escolares: "🎒",
    Espacial: "🌌",
    Fantasía: "🧙",
    Harem: "💑",
    Histórico: "🏯",
    Infantil: "🧸",
    Josei: "👩",
    Juegos: "🎮",
    Magia: "✨",
    Mecha: "🤖",
    Militar: "🎖️",
    Misterio: "🔍",
    Música: "🎵",
    Parodia: "😜",
    Policía: "👮",
    Psicológico: "🧠",
    "Recuentos de la vida": "🌸",
    Romance: "💕",
    Samurai: "🗡️",
    Seinen: "👨",
    Shoujo: "👧",
    Shounen: "👦",
    Sobrenatural: "👻",
    Superpoderes: "💥",
    Suspenso: "😰",
    Terror: "👿",
    Vampiros: "🧛",
    Yaoi: "💙",
    Yuri: "💜",
  };
  return emojis[genre] || "📺";
}

export default function GenresPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Géneros
          </h1>
          <p className="text-gray-400 mt-1">
            Explora anime por género
          </p>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {AnimeGenres.map((genre) => (
            <Link
              key={genre}
              href={`/genres/${encodeURIComponent(genre)}`}
              className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-red-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getGenreGradient(
                  genre
                )} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
              />
              <div className="relative p-4 sm:p-5">
                <span className="text-2xl sm:text-3xl block mb-2">
                  {getGenreEmoji(genre)}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-gray-200 group-hover:text-red-400 transition-colors">
                  {genre}
                </h3>
                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                  Ver anime &rarr;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
