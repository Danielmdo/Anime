"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useHistory } from "@/components/HistoryProvider";
import type { AnimeData, VideoServer, EpisodeServers } from "@/lib/types";

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

  // Video servers state
  const [servers, setServers] = useState<VideoServer[]>([]);
  const [activeServer, setActiveServer] = useState<VideoServer | null>(null);
  const [loadingServers, setLoadingServers] = useState(true);
  const [serversError, setServersError] = useState(false);

  // Ref for the video container (for Fullscreen API)
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen change events
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Toggle fullscreen on the player container
  const toggleFullscreen = useCallback(async () => {
    const el = playerContainerRef.current;
    if (!el || !document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen denied by user policy
    }
  }, []);

  // Fetch video servers
  const fetchServers = useCallback(async () => {
    setLoadingServers(true);
    setServersError(false);
    try {
      const res = await fetch(`/api/episode/${animeId}/${epNumber}`);
      if (!res.ok) throw new Error("Failed to fetch servers");
      const data: EpisodeServers = await res.json();
      const availableServers = Object.values(data).flat().filter(Boolean) as VideoServer[];
      if (availableServers.length > 0) {
        setServers(availableServers);
        setActiveServer(availableServers[0]);
      } else {
        setServersError(true);
      }
    } catch {
      setServersError(true);
    } finally {
      setLoadingServers(false);
    }
  }, [animeId, epNumber]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Save to history
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

        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden border border-gray-800 mb-4">
          <div ref={playerContainerRef} className="relative aspect-video bg-black">
            {loadingServers ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Cargando servidores de video...
                  </p>
                </div>
              </div>
            ) : serversError || !activeServer ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <svg
                    className="w-16 h-16 text-gray-700 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-400 mb-2 font-medium">
                    No se pudieron cargar los servidores de video
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    Esto puede ocurrir si AnimeFLV está bloqueando la conexión.
                  </p>
                  <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={fetchServers}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reintentar
                  </button>
                  <a
                    href={`https://www3.animeflv.net/ver/${animeId}-${epNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver en AnimeFLV
                  </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <iframe
                  src={activeServer.code}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen={true}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  referrerPolicy="origin"
                />
                {/* Custom Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white/70 hover:text-white opacity-60 hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-white/10"
                  title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Server Selector */}
        {servers.length > 1 && !loadingServers && !serversError && (
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
                Servidores:
              </span>
              {servers.map((server) => (
                <button
                  key={server.server}
                  onClick={() => setActiveServer(server)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeServer?.server === server.server
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {server.title || server.server}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Episode Info Bar */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl overflow-hidden border border-gray-800 mb-6">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Small Cover */}
            {animeCover ? (
              <div className="shrink-0 w-16 sm:w-20">
                <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-gray-700">
                  <img
                    src={animeCover}
                    alt={animeTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <span className="inline-block bg-red-600/90 text-white text-xs font-medium px-2.5 py-0.5 rounded-md mb-2">
                Episodio {epNumber}
                {totalEps > 0 && ` de ${totalEps}`}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {animeTitle}
              </h1>
            </div>

            {/* Direct link on AnimeFLV */}
            <a
              href={`https://www3.animeflv.net/ver/${animeId}-${epNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors border border-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              AnimeFLV
            </a>
          </div>
        </div>

        {/* Synopsis (only if available) */}
        {anime?.synopsis && (
          <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sinopsis
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {anime.synopsis}
            </p>
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

        {/* Episode List */}
        {!anime && totalEps === 0 && (
          <div className="mt-10 pb-12 text-center">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-lg mx-auto">
              <p className="text-gray-400 mb-4">
                No se pudo cargar la lista de episodios.
              </p>
              <a
                href={`https://www3.animeflv.net/ver/${animeId}-${epNumber}`}
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
