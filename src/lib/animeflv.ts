import type {
  AnimeData,
  ChapterData,
  SearchAnimeResults,
  AnimeOnAirData,
  FilterOptions,
} from "./types";

const API_TIMEOUT = 8000; // 8 seconds — under Vercel's 10s serverless limit

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
  try {
    const api = getApi();
    const result: ChapterData[] = await withTimeout(api.getLatest());
    return result || [];
  } catch (error) {
    console.error("Error fetching latest episodes:", error);
    return [];
  }
}

export async function getAnimeInfo(animeId: string): Promise<AnimeData | null> {
  try {
    const api = getApi();
    const result: AnimeData = await withTimeout(api.getAnimeInfo(animeId));
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
    const api = getApi();
    const result: SearchAnimeResults = await withTimeout(
      api.searchAnime(query)
    );
    return result || null;
  } catch (error) {
    console.error("Error searching anime:", error);
    return null;
  }
}

export async function getOnAir(): Promise<AnimeOnAirData[]> {
  try {
    const api = getApi();
    const result: AnimeOnAirData[] = await withTimeout(api.getOnAir());
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
    const api = getApi();
    const result: SearchAnimeResults = await withTimeout(
      api.searchAnimesByFilter(opts)
    );
    return result || null;
  } catch (error) {
    console.error("Error filtering anime:", error);
    return null;
  }
}
