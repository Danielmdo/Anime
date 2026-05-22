"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import type { AnimeSearchResult } from "@/lib/types";
import { AnimeGenres } from "@/lib/types";

interface PageProps {
  params: Promise<{ genre: string }>;
}

export default function GenrePage({ params }: PageProps) {
  const { genre } = use(params);
  const decodedGenre = decodeURIComponent(genre);
  const validGenre = AnimeGenres.find(
    (g) => g.toLowerCase() === decodedGenre.toLowerCase()
  );

  const [animes, setAnimes] = useState<AnimeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!validGenre) return;
    const fetchByGenre = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/filter?genres=${encodeURIComponent(validGenre)}`
        );
        const data = await res.json();
        setAnimes(data?.data || []);
      } catch (err) {
        console.error("Error fetching genre:", err);
        setAnimes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchByGenre();
  }, [validGenre]);

  if (!validGenre) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Género no encontrado
          </h1>
          <Link
            href="/genres"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            ← Volver a géneros
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link
            href="/genres"
            className="hover:text-white transition-colors"
          >
            Géneros
          </Link>
          <span>/</span>
          <span className="text-red-400">{validGenre}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {validGenre}
          </h1>
          <p className="text-gray-400 mt-1">
            Anime del género {validGenre}
          </p>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
          </div>
        ) : animes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No se encontraron animes para este género.
            </p>
            <Link
              href="/genres"
              className="inline-block mt-4 text-red-400 hover:text-red-300 transition-colors"
            >
              ← Explorar otros géneros
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
