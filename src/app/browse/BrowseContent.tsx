"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import { AnimeGenres, AnimeTypes, AnimeStatuses } from "@/lib/types";
import type { AnimeSearchResult, SearchAnimeResults } from "@/lib/types";
import { Search, Sliders, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      setLoading(true);
      setSearched(true);
      setCurrentPage(1);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`
        );
        const data: SearchAnimeResults = await res.json();
        setResults(data?.data || []);
        setTotalPages(data?.foundPages || 1);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const performFilter = useCallback(async (page = 1) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (selectedGenres.length > 0)
        params.set("genres", selectedGenres.join(","));
      if (selectedType) params.set("types", selectedType);
      if (selectedStatus) params.set("statuses", selectedStatus);
      params.set("page", String(page));

      const res = await fetch(`/api/filter?${params.toString()}`);
      const data: SearchAnimeResults = await res.json();
      setResults(data?.data || []);
      setTotalPages(data?.foundPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error("Filter failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGenres, selectedType, selectedStatus]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
      performSearch(query.trim());
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const clearAll = () => {
    setQuery("");
    setSelectedGenres([]);
    setSelectedType("");
    setSelectedStatus("");
    setResults([]);
    setSearched(false);
    setCurrentPage(1);
    setTotalPages(1);
    router.push("/browse");
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (query.trim()) {
      performSearch(query.trim());
    } else {
      performFilter(page);
    }
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

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Explorar
          </h1>
          <p className="text-gray-400 mt-1">
            Busca anime o filtra por género, tipo y estado
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar anime por nombre..."
                className="w-full bg-gray-900 text-white rounded-xl pl-12 pr-4 py-3 border border-gray-800 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-medium transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-colors ${
                showFilters
                  ? "bg-red-600/10 border-red-500 text-red-400"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Filtros
              </h2>
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Tipo
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType("")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    !selectedType
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                {AnimeTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setSelectedType(selectedType === type ? "" : type)
                    }
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedType === type
                        ? "bg-red-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Estado
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus("")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    !selectedStatus
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                {AnimeStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setSelectedStatus(
                        selectedStatus === status ? "" : status
                      )
                    }
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedStatus === status
                        ? "bg-red-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Géneros
              </p>
              <div className="flex flex-wrap gap-2">
                {AnimeGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedGenres.includes(genre)
                        ? "bg-red-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => performFilter(1)}
              className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
          </div>
        ) : searched ? (
          results.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  {results.length} resultado{results.length !== 1 ? "s" : ""}{" "}
                  encontrado{results.length !== 1 ? "s" : ""}
                  {totalPages > 1 && (
                    <span className="text-gray-600 ml-2">
                      — Página {currentPage} de {totalPages}
                    </span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10 pb-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 text-lg">
                No se encontraron resultados
              </p>
              <p className="text-gray-600 mt-1">
                Intenta con otro término de búsqueda o ajusta los filtros.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800">
              <Sliders className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400">
              Busca o filtra anime
            </h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Usa la barra de búsqueda para encontrar tu anime favorito o activa
              los filtros para explorar por género, tipo y estado.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {AnimeGenres.slice(0, 8).map((genre) => (
                <Link
                  key={genre}
                  href={`/genres/${encodeURIComponent(genre)}`}
                  className="px-3 py-1.5 bg-gray-900 text-gray-400 rounded-full text-sm border border-gray-800 hover:border-red-500/40 hover:text-red-400 transition-colors"
                >
                  {genre}
                </Link>
              ))}
              <Link
                href="/genres"
                className="px-3 py-1.5 bg-gray-900 text-red-400 rounded-full text-sm border border-gray-800 hover:border-red-500/40 transition-colors"
              >
                Ver todos →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
