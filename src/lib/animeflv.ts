import type {
  AnimeData,
  ChapterData,
  SearchAnimeResults,
  AnimeOnAirData,
  FilterOptions,
  EpisodeServers,
} from "./types";
import { scrapeAnimeInfo, getEpisodeServers as getScraperServers } from "./scraper";
import {
  searchAnime as searchV1,
  getAnimeInfo as getInfoV1,
  getLatestEpisodes as getLatestV1,
  getOnAir as getOnAirV1,
  searchByFilter as filterV1,
  getEpisodeServers as getServersV1,
} from "./animev1";

const API_TIMEOUT = 8000;

// Lazy load animeflv-api — avoid top-level require that hangs Vercel's build
function getApi() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("animeflv-api");
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = API_TIMEOUT
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function getLatestEpisodes(): Promise<ChapterData[]> {
  // Try animev1 first
  try {
    const result = await getLatestV1();
    if (result && result.length > 0) return result;
  } catch (error) {
    console.error("animev1 getLatestEpisodes failed:", error);
  }

  // Fallback: animeflv-api
  try {
    const api = getApi();
    const result: ChapterData[] = await withTimeout(api.getLatest());
    return result || [];
  } catch (error) {
    console.error("animeflv-api getLatest failed:", error);
    return [];
  }
}

export async function getAnimeInfo(animeId: string): Promise<AnimeData | null> {
  // Try animev1 first
  try {
    const result = await getInfoV1(animeId);
    if (result) return result;
  } catch (error) {
    console.error("animev1 getAnimeInfo failed:", error);
  }

  // Fallback: animeflv-api
  try {
    const api = getApi();
    const result: AnimeData = await withTimeout(api.getAnimeInfo(animeId));
    if (result) return result;
  } catch (error) {
    console.error("animeflv-api getAnimeInfo failed:", error);
  }

  // Fallback: custom scraper
  console.log("Falling back to custom scraper for anime:", animeId);
  return scrapeAnimeInfo(animeId);
}

export async function searchAnime(
  query: string
): Promise<SearchAnimeResults | null> {
  // Try animev1 first
  try {
    const result = await searchV1(query);
    if (result && result.data && result.data.length > 0) return result;
  } catch (error) {
    console.error("animev1 searchAnime failed:", error);
  }

  // Fallback: animeflv-api
  try {
    const api = getApi();
    const result: SearchAnimeResults = await withTimeout(
      api.searchAnime(query)
    );
    return result || null;
  } catch (error) {
    console.error("animeflv-api searchAnime failed:", error);
    return null;
  }
}

export async function getOnAir(): Promise<AnimeOnAirData[]> {
  // Try animev1 first
  try {
    const result = await getOnAirV1();
    if (result && result.length > 0) return result;
  } catch (error) {
    console.error("animev1 getOnAir failed:", error);
  }

  // Fallback: animeflv-api
  try {
    const api = getApi();
    const result: AnimeOnAirData[] = await withTimeout(api.getOnAir());
    return result || [];
  } catch (error) {
    console.error("animeflv-api getOnAir failed:", error);
    return [];
  }
}

export async function searchByFilter(
  opts: FilterOptions
): Promise<SearchAnimeResults | null> {
  // Try animev1 first
  try {
    const result = await filterV1(opts);
    if (result && result.data && result.data.length > 0) return result;
  } catch (error) {
    console.error("animev1 searchByFilter failed:", error);
  }

  // Fallback: animeflv-api
  try {
    const api = getApi();
    const result: SearchAnimeResults = await withTimeout(
      api.searchAnimesByFilter(opts)
    );
    return result || null;
  } catch (error) {
    console.error("animeflv-api searchByFilter failed:", error);
    return null;
  }
}

export async function getEpisodeServers(
  animeId: string,
  episodeNum: number
): Promise<EpisodeServers | null> {
  // Try animev1 first
  try {
    const result = await getServersV1(animeId, episodeNum);
    if (result) return result;
  } catch (error) {
    console.error("animev1 getEpisodeServers failed:", error);
  }

  // Fallback: custom scraper
  try {
    const result = await getScraperServers(animeId, episodeNum);
    if (result) return result;
  } catch (error) {
    console.error("scraper getEpisodeServers failed:", error);
  }

  return null;
}
