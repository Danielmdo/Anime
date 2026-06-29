"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimeCard from "@/components/AnimeCard";
import type { AnimeSearchResult, SearchAnimeResults } from "@/lib/types";
import { AnimeGenres } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ genre: string }>;
}

export default function GenrePage({ params }: PageProps) {
  const { genre } = use(params);
  const router = useRouter();
  const decodedGenre = decodeURIComponent(genre);
  const validGenre = AnimeGenres.find(
    (g) => g.toLowerCase() === decodedGenre.toLowerCase()
  );

  const [animes, setAnimes] = useState<AnimeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchByGenre = useCallback(async (page: number) => {
    if (!validGenre) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/filter?genres=${encodeURIComponent(validGenre)}&page=${page}`
      );
      const data: SearchAnimeResults = await res.json();
      setAnimes(data?.data || []);
      setTotalPages(data?.foundPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching genre:", err);
      setAnimes([]);
    } finally {
      setLoading(false);
    }
  }, [validGenre]);

  useEffect(() => {
    fetchByGenre(1);
  }, [fetchByGenre]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchByGenre(page);
  };

  // Generate page numbers to show (max 7)
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

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
            {totalPages > 1 && (
              <span className="text-gray-600 ml-2">
                — Página {currentPage} de {totalPages}
              </span>
            )}
          </p>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
          </div>
        ) : animes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {animes.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10 pb-8">
                {/* Previous */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-2 text-gray-600 text-sm"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[2.25rem] px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          page === currentPage
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105"
                            : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
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
