"use client";

import Link from "next/link";
import GenreBadge from "@/components/GenreBadge";
import type { AnimeData } from "@/lib/types";

interface AnimeDetailClientProps {
  anime: AnimeData | null;
  animeId: string;
}

export default function AnimeDetailClient({
  anime,
  animeId,
}: AnimeDetailClientProps) {
  const episodes = anime?.episodes || 0;
  const totalEpisodes = typeof episodes === "number" ? episodes : 0;
  const animeTitle = anime?.title || animeId.replace(/-/g, " ");

  // If the scraper failed, show a fallback page with a direct link
  if (!anime) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {animeTitle}
          </h1>
          <p className="text-gray-400 mb-6">
            No se pudo cargar la información del anime desde AnimeFLV.
            Puedes intentar verlo directamente en su sitio.
          </p>
          <a
            href={`https://www3.animeflv.net/anime/${animeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Ver en AnimeFLV
          </a>
          <div className="mt-6">
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/70 to-gray-950 z-10" />
        <img
          src={anime.cover}
          alt={anime.title}
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-20 -mt-28 sm:-mt-40 flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Cover Image */}
          <div className="shrink-0 w-40 sm:w-52 lg:w-60 mx-auto sm:mx-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-gray-800">
              <img
                src={anime.cover}
                alt={anime.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-0 sm:pt-16">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {anime.type && (
                <span className="bg-red-600/90 text-white text-xs font-medium px-2.5 py-0.5 rounded-md">
                  {anime.type}
                </span>
              )}
              {anime.status && (
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                    anime.status === "En emision"
                      ? "bg-green-600/90 text-white"
                      : anime.status === "Finalizado"
                      ? "bg-blue-600/90 text-white"
                      : "bg-yellow-600/90 text-white"
                  }`}
                >
                  {anime.status}
                </span>
              )}
              {anime.rating && (
                <span className="bg-yellow-500/90 text-gray-950 text-xs font-bold px-2 py-0.5 rounded-md">
                  ★ {anime.rating}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {anime.title}
            </h1>

            {anime.alternative_titles?.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {anime.alternative_titles.join(" / ")}
              </p>
            )}

            {/* Genres */}
            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {anime.genres.map((genre) => (
                  <GenreBadge key={genre} genre={genre} size="sm" />
                ))}
              </div>
            )}

            {/* Synopsis */}
            {anime.synopsis && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sinopsis
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {anime.synopsis}
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Episodios
                </p>
                <p className="text-lg font-bold text-white mt-1">
                  {totalEpisodes}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Tipo
                </p>
                <p className="text-lg font-bold text-white mt-1">
                  {anime.type || "N/A"}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Estado
                </p>
                <p className="text-lg font-bold text-white mt-1">
                  {anime.status || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Episode List */}
        {totalEpisodes > 0 && (
          <section className="mt-10 pb-12">
            <h2 className="text-xl font-bold text-white mb-4">
              Episodios
              <span className="text-gray-500 text-base font-normal ml-2">
                ({totalEpisodes} disponibles)
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map(
                (ep) => (
                  <Link
                    key={ep}
                    href={`/anime/${animeId}/episode/${ep}`}
                    className="bg-gray-900 hover:bg-red-600/20 border border-gray-800 hover:border-red-500/50 rounded-lg py-3 px-3 text-center transition-all duration-200 group"
                  >
                    <p className="text-xs text-gray-500 group-hover:text-red-400 transition-colors">
                      EPISODIO
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5">
                      {ep}
                    </p>
                  </Link>
                )
              )}
            </div>
          </section>
        )}

        {/* No episodes message */}
        {totalEpisodes === 0 && (
          <section className="mt-10 pb-12 text-center">
            <p className="text-gray-500">
              No hay episodios disponibles para este anime.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
