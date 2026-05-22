"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useHistory } from "@/components/HistoryProvider";
import type { AnimeData } from "@/lib/types";

interface WatchEpisodeClientProps {
  anime: AnimeData;
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
  const totalEps = anime.episodes || 0;

  useEffect(() => {
    addToHistory({
      animeId,
      animeTitle: anime.title,
      cover: anime.cover,
      episode: epNumber,
      episodeTitle: `Episodio ${epNumber}`,
    });
  }, [animeId, epNumber, anime.title, anime.cover, addToHistory]);

  const embedUrl = `https://www3.animeflv.net/ver/${animeId}-${epNumber}`;

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
            {anime.title}
          </Link>
          <span>/</span>
          <span className="text-red-400">Episodio {epNumber}</span>
        </nav>

        {/* Video Section */}
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="aspect-video bg-black relative">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-forms allow-presentation allow-popups"
            />
          </div>
        </div>

        {/* Episode Info */}
        <div className="mt-6 bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={anime.cover}
                alt={anime.title}
                className="w-16 h-20 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {anime.title}
                </h1>
                <p className="text-sm text-red-400 mt-0.5">
                  Episodio {epNumber}
                </p>
              </div>
            </div>
            <Link
              href={`/anime/${animeId}`}
              className="text-sm text-gray-400 hover:text-white bg-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              Información
            </Link>
          </div>
        </div>

        {/* Episode Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
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
      </div>
    </div>
  );
}
