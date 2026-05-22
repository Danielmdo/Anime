"use client";

import { useState } from "react";
import Link from "next/link";
import EpisodeCard from "@/components/EpisodeCard";
import type { ChapterData, AnimeOnAirData } from "@/lib/types";

interface HomeClientProps {
  latest: ChapterData[];
  onAir: AnimeOnAirData[];
}

export default function HomeClient({ latest, onAir }: HomeClientProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleEpisodes = showAll ? latest : latest.slice(0, 24);
  const hasMore = latest.length > 24;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Tu portal de{" "}
              <span className="text-red-500">anime</span> en español
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-400 leading-relaxed">
              Explora los últimos episodios, descubre nuevos animes por género y
              mantén un registro de todo lo que has visto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Explorar Catálogo
                <svg
                  className="w-4 h-4"
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
              <Link
                href="/genres"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium px-5 py-2.5 rounded-lg transition-colors border border-gray-700"
              >
                Ver Géneros
              </Link>
            </div>
          </div>

          {/* On Air Strip */}
          {onAir.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                En Emisión
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {onAir.slice(0, 20).map((anime) => (
                  <Link
                    key={anime.id}
                    href={`/anime/${anime.id}`}
                    className="shrink-0 bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap border border-gray-700/50"
                  >
                    {anime.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Latest Episodes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Últimos Episodios
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Los episodios más recientes agregados a AnimeFLV
            </p>
          </div>
        </div>

        {latest.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500">
              No se pudieron cargar los episodios. Intenta de nuevo más tarde.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleEpisodes.map((ep, i) => (
                <EpisodeCard key={`${ep.url}-${i}`} episode={ep} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium px-6 py-2.5 rounded-lg transition-colors border border-gray-700"
                >
                  {showAll
                    ? "Mostrar menos"
                    : `Mostrar todos (${latest.length})`}
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showAll ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            AnimeFLV Web - Proyecto educativo. Los datos son obtenidos de
            AnimeFLV.
          </p>
        </div>
      </footer>
    </div>
  );
}
