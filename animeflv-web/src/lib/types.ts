export interface AnimeSearchResult {
  title: string;
  cover: string;
  synopsis: string;
  rating: string;
  id: string;
  type: string;
  url: string;
}

export interface SearchAnimeResults {
  previousPage: string | null;
  nextPage: string | null;
  foundPages: number;
  data: AnimeSearchResult[];
}

export interface ChapterData {
  title: string;
  chapter: number;
  cover: string;
  url: string;
}

export interface AnimeOnAirData {
  title: string;
  type: string;
  id: string;
  url: string;
}

export interface AnimeData {
  title: string;
  alternative_titles: string[];
  status: string;
  rating: string;
  type: string;
  cover: string;
  synopsis: string;
  genres: string[];
  episodes: number;
  url: string;
}

export interface FilterOptions {
  types?: string[];
  genres?: string[];
  statuses?: string[];
}

export interface EpisodeData {
  title: string;
  chapter: number;
  cover: string;
  url: string;
}

export interface HistoryItem {
  animeId: string;
  animeTitle: string;
  cover: string;
  episode: number;
  episodeTitle: string;
  timestamp: number;
}

export const AnimeGenres = [
  "Acción", "Artes Marciales", "Aventuras", "Carreras",
  "Ciencia Ficción", "Comedia", "Demencia", "Demonios",
  "Deportes", "Drama", "Ecchi", "Escolares", "Espacial",
  "Fantasía", "Harem", "Histórico", "Infantil", "Josei",
  "Juegos", "Magia", "Mecha", "Militar", "Misterio",
  "Música", "Parodia", "Policía", "Psicológico",
  "Recuentos de la vida", "Romance", "Samurai", "Seinen",
  "Shoujo", "Shounen", "Sobrenatural", "Superpoderes",
  "Suspenso", "Terror", "Vampiros", "Yaoi", "Yuri"
] as const;

export const AnimeStatuses = ["En emision", "Finalizado", "Proximamente"] as const;
export const AnimeTypes = ["OVA", "Anime", "Película", "Especial"] as const;
