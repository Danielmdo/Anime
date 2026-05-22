"use client";

import Link from "next/link";
import type { ChapterData } from "@/lib/types";

interface EpisodeCardProps {
  episode: ChapterData;
  animeId?: string;
}

export default function EpisodeCard({ episode, animeId }: EpisodeCardProps) {
  const extractAnimeId = (url: string) => {
    const match = url.match(/\/ver\/(.+?)-\d+$/);
    if (match) return match[1];
    const parts = url.split("/");
    return parts[parts.length - 1] || "";
  };

  const id = animeId || extractAnimeId(episode.url);
  const episodeNum = episode.chapter;
  const href = `/anime/${id}/episode/${episodeNum}`;

  return (
    <Link
      href={href}
      className="group flex gap-3 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-red-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5"
    >
      <div className="relative w-28 sm:w-32 shrink-0">
        <img
          src={episode.cover}
          alt={episode.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-3 pr-3">
        <p className="text-xs text-red-500 font-medium uppercase tracking-wider">
          Episodio {episodeNum}
        </p>
        <h3 className="text-sm font-medium text-gray-200 mt-1 line-clamp-2 group-hover:text-red-400 transition-colors">
          {episode.title}
        </h3>
      </div>
    </Link>
  );
}
