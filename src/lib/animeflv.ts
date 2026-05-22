// eslint-disable-next-line @typescript-eslint/no-var-requires
const animeflv = require("animeflv-api");

import type {
  AnimeData,
  ChapterData,
  SearchAnimeResults,
  AnimeOnAirData,
  FilterOptions,
} from "./types";

export async function getLatestEpisodes(): Promise<ChapterData[]> {
  try {
    const result: ChapterData[] = await animeflv.getLatest();
    return result || [];
  } catch (error) {
    console.error("Error fetching latest episodes:", error);
    return [];
  }
}

export async function getAnimeInfo(animeId: string): Promise<AnimeData | null> {
  try {
    const result: AnimeData = await animeflv.getAnimeInfo(animeId);
    return result || null;
  } catch (error) {
    console.error("Error fetching anime info:", error);
    return null;
  }
}

export async function searchAnime(
  query: string
): Promise<SearchAnimeResults | null> {
  try {
    const result: SearchAnimeResults = await animeflv.searchAnime(query);
    return result || null;
  } catch (error) {
    console.error("Error searching anime:", error);
    return null;
  }
}

export async function getOnAir(): Promise<AnimeOnAirData[]> {
  try {
    const result: AnimeOnAirData[] = await animeflv.getOnAir();
    return result || [];
  } catch (error) {
    console.error("Error fetching on-air anime:", error);
    return [];
  }
}

export async function searchByFilter(
  opts: FilterOptions
): Promise<SearchAnimeResults | null> {
  try {
    const result: SearchAnimeResults = await animeflv.searchAnimesByFilter(
      opts
    );
    return result || null;
  } catch (error) {
    console.error("Error filtering anime:", error);
    return null;
  }
}
