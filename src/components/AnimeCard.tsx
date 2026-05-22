"use client";

import Link from "next/link";
import type { AnimeSearchResult } from "@/lib/types";

interface AnimeCardProps {
  anime: AnimeSearchResult;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={anime.cover}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {anime.rating && (
          <div className="absolute top-2 right-2 bg-yellow-500/90 text-gray-950 text-xs font-bold px-2 py-0.5 rounded-md">
            ★ {anime.rating}
          </div>
        )}
        {anime.type && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-white text-xs font-medium px-2 py-0.5 rounded-md">
            {anime.type}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-200 line-clamp-2 group-hover:text-red-400 transition-colors">
          {anime.title}
        </h3>
        {anime.synopsis && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {anime.synopsis}
          </p>
        )}
      </div>
    </Link>
  );
}
