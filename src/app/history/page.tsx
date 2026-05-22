"use client";

import Link from "next/link";
import { useHistory } from "@/components/HistoryProvider";
import { Clock, Trash2, Play, Film, X } from "lucide-react";

export default function HistoryPage() {
  const { history, clearHistory, removeFromHistory } = useHistory();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `Hace ${minutes} min`;
      }
      return `Hace ${hours}h`;
    }
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const groupedByAnime = history.reduce<
    Record<string, typeof history>
  >((acc, item) => {
    if (!acc[item.animeId]) {
      acc[item.animeId] = [];
    }
    acc[item.animeId].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Historial
            </h1>
            <p className="text-gray-400 mt-1">
              Episodios que has visto recientemente
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg border border-gray-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar historial
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800">
              <Clock className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400">
              No hay historial
            </h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Los episodios que veas aparecerán aquí para que puedas retomarlos
              fácilmente.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 bg-red-600 hover:bg-red-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Film className="w-4 h-4" />
              Ver últimos episodios
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByAnime).map(
              ([animeId, episodes]) => (
                <div
                  key={animeId}
                  className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
                >
                  {/* Anime Header */}
                  <div className="flex items-center gap-3 p-4 bg-gray-900/50 border-b border-gray-800">
                    <img
                      src={episodes[0].cover}
                      alt={episodes[0].animeTitle}
                      className="w-12 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/anime/${animeId}`}
                        className="text-sm font-semibold text-gray-200 hover:text-red-400 transition-colors line-clamp-1"
                      >
                        {episodes[0].animeTitle}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {episodes.length} episodio
                        {episodes.length !== 1 ? "s" : ""} visto
                        {episodes.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Episodes */}
                  <div className="divide-y divide-gray-800">
                    {episodes.map((item) => (
                      <div
                        key={`${item.animeId}-${item.episode}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                      >
                        <Link
                          href={`/anime/${item.animeId}/episode/${item.episode}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-300">
                              Episodio {item.episode}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(item.timestamp)}
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={() =>
                            removeFromHistory(item.animeId, item.episode)
                          }
                          className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                          title="Eliminar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
