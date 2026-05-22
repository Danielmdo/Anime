"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useHistory } from "@/components/HistoryProvider";
import type { AnimeData } from "@/lib/types";

interface WatchEpisodeClientProps {
  anime: AnimeData | null;
  animeId: string;
  episodeNum: string;
}

export default function WatchEpisodeClient({
  anime,
  animeId,
  episodeNum,
}: WatchEpisodeClientProps) {
  const { addToHistory } = useHistory();
  const epNumber = parseInt(episodeNum);
  const totalEps = anime?.episodes || 0;
  const animeTitle = anime?.title || animeId.replace(/-/g, " ");
  const animeCover = anime?.cover || "";

  // AnimeFLV episode URL
  const animeflvUrl = `https://www3.animeflv.net/ver/${animeId}-${epNumber}`;

  useEffect(() => {
    addToHistory({
      animeId,
      animeTitle,
      cover: animeCover,
      episode: epNumber,
      episodeTitle: `Episodio ${epNumber}`,
    });
  }, [animeId, epNumber, animeTitle, animeCover, addToHistory]);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link
            href={`/anime/${animeId}`}
            className="hover:text-white transition-colors truncate max-w-[200px]"
          >
            {animeTitle}
          </Link>
          <span>/</span>
          <span className="text-red-400">Episodio {epNumber}</span>
        </nav>

        {/* Watch Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl overflow-hidden border border-gray-800 mb-6">
          <div className="p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
            {/* Cover (only if available) */}
            {animeCover ? (
              <div className="shrink-0 w-36 sm:w-44">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-xl shadow-black/50 border border-gray-700">
                  <img
                    src={animeCover}
                    alt={animeTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="shrink-0 w-36 sm:w-44">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-xl shadow-black/50 border border-gray-700 bg-gray-800 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Info & Watch Button */}
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block bg-red-600/90 text-white text-xs font-medium px-2.5 py-0.5 rounded-md mb-3">
                Episodio {epNumber}
                {totalEps > 0 && ` de ${totalEps}`}
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2">
                {animeTitle}
              </h1>
              <p className="text-gray-400 text-sm mb-6">
                Este episodio se reproduce en AnimeFLV. Haz clic en el botón
                para verlo.
              </p>

              <a
                href={animeflvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 hover:-translate-y-0.5 group"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-lg">Reproducir en AnimeFLV</span>
                <svg
                  className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>

              <p className="text-xs text-gray-600 mt-4">
                Se abrirá AnimeFLV en una nueva pestaña
              </p>

              {!anime && (
                <p className="text-xs text-yellow-600 mt-3">
                  No se pudo cargar la información del anime. El enlace
                  sigue funcionando.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Episode Info (only if available) */}
        {anime?.synopsis && (
          <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sinopsis
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                  {anime.synopsis || "Sin sinopsis disponible."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Episode Navigation */}
        <div className="flex items-center justify-between gap-4">
          {epNumber > 1 ? (
            <Link
              href={`/anime/${animeId}/episode/${epNumber - 1}`}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-200 px-4 py-2.5 rounded-lg transition-colors border border-gray-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Anterior
            </Link>
          ) : (
            <div />
          )}

          {totalEps > 0 && (
            <span className="text-sm text-gray-500">
              Episodio {epNumber} de {totalEps}
            </span>
          )}

          {epNumber < totalEps ? (
            <Link
              href={`/anime/${animeId}/episode/${epNumber + 1}`}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              Siguiente
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Episode List (only if we know the total) */}
        {!anime && (
          <div className="mt-10 pb-12 text-center">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-lg mx-auto">
              <p className="text-gray-400 mb-4">
                No se pudo cargar la lista de episodios. Puedes ver este
                episodio directamente en AnimeFLV.
              </p>
              <a
                href={animeflvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-colors border border-gray-700"
              >
                Ir a AnimeFLV
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
        {totalEps > 1 && (
          <section className="mt-10 pb-12">
            <h2 className="text-lg font-bold text-white mb-4">
              Todos los episodios
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {Array.from({ length: totalEps }, (_, i) => i + 1).map((ep) => (
                <Link
                  key={ep}
                  href={`/anime/${animeId}/episode/${ep}`}
                  className={`rounded-lg py-2.5 px-2 text-center transition-all duration-200 ${
                    ep === epNumber
                      ? "bg-red-600 text-white font-bold shadow-lg shadow-red-600/25"
                      : "bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs">{ep}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
