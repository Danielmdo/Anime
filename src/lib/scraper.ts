import type { AnimeData, EpisodeServers } from "./types";

const SCRAPER_TIMEOUT = 15000;

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = SCRAPER_TIMEOUT
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Fetch a page from AnimeFLV using cloudscraper to bypass Cloudflare.
 */
async function fetchPage(url: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cloudscraper = require("cloudscraper");
  return withTimeout(
    cloudscraper({
      uri: url,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www3.animeflv.net/",
        "Cache-Control": "private",
        Connection: "keep-alive",
      },
    })
  );
}

/**
 * Extract anime detail info from an AnimeFLV anime page.
 * This replaces the broken getAnimeInfo from animeflv-api.
 */
export async function scrapeAnimeInfo(
  animeId: string
): Promise<AnimeData | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");

    const url = `https://www3.animeflv.net/anime/${animeId}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Extract basic info using the same selectors as animeflv-api
    const title = $(
      "body > div.Wrapper > div > div > div.Ficha.fchlt > div.Container > h1"
    )
      .text()
      .trim();
    const statusRaw = $(
      "body > div.Wrapper > div > div > div.Container > div > aside > p > span"
    )
      .text()
      .trim();
    const rating = $("#votes_prmd").text().trim();
    const type = $(
      "body > div.Wrapper > div > div > div.Ficha.fchlt > div.Container > span"
    )
      .text()
      .trim();

    const coverImg = $(
      "body > div.Wrapper > div > div > div.Container > div > aside > div.AnimeCover > div > figure > img"
    );
    const cover = coverImg.length > 0
      ? "https://animeflv.net" + coverImg.attr("src")
      : "";

    const synopsis = $(
      "body > div.Wrapper > div > div > div.Container > div > main > section:nth-child(1) > div.Description > p"
    )
      .text()
      .trim();

    // Extract genres
    const genres: string[] = [];
    $(
      "body > div.Wrapper > div > div > div.Container > div > main > section:nth-child(1) > nav > a"
    ).each((_i: number, el: any) => {
      const genre = $(el).text().trim();
      if (genre) genres.push(genre);
    });

    // Extract alternative titles
    const alternative_titles: string[] = [];
    $(
      "body > div.Wrapper > div > div > div.Ficha.fchlt > div.Container > div:nth-child(3) > span"
    ).each((_i: number, el: any) => {
      const alt = $(el).text().trim();
      if (alt) alternative_titles.push(alt);
    });

    // Extract episodes from script tags
    let episodeCount = 0;
    $("script").each((_i: number, el: any) => {
      const content = $(el).html() || "";
      if (content.includes("episodes")) {
        // Try different regex patterns to match the episodes array
        const match =
          content.match(/episodes\s*=\s*(\[\[[\s\S]*?\]\])\s*;/) ||
          content.match(/episodes\s*=\s*(\[[\s\S]*?\])\s*;/) ||
          content.match(/episodes\s*=\s*(\[[\s\S]*?\])/);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
              episodeCount = parsed.length;
              return false;
            }
          } catch {
            // Try without the last bracket if split across lines
            try {
              const cleaned = match[1].replace(/\s*;?\s*$/, "");
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed)) {
                episodeCount = parsed.length;
                return false;
              }
            } catch {
              // Not parseable, continue
            }
          }
        }
      }
    });

    return {
      title,
      alternative_titles,
      status: statusRaw,
      rating,
      type,
      cover,
      synopsis,
      genres,
      episodes: episodeCount,
      url,
    };
  } catch (error) {
    console.error("Error scraping anime info:", error);
    return null;
  }
}

/**
 * Extract video server data from an AnimeFLV episode page.
 * Uses cloudscraper (same as animeflv-api) to bypass Cloudflare.
 */
export async function getEpisodeServers(
  animeId: string,
  episodeNum: number
): Promise<EpisodeServers | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");

    const url = `https://www3.animeflv.net/ver/${animeId}-${episodeNum}`;
    const html = await fetchPage(url);

    const $ = cheerio.load(html);

    // Find script tags that contain video server data
    let serversData: EpisodeServers | null = null;

    $("script").each((_i: number, el: any) => {
      const content = $(el).html() || "";
      // Look for patterns like: var videos = {...} or videos = {...}
      if (
        content.includes("videos") &&
        (content.includes("server") || content.includes("code"))
      ) {
        // Try to extract JSON object after "=" sign
        const match = content.match(/videos\s*=\s*(\{[\s\S]*?\});/);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1]);
            serversData = parsed as EpisodeServers;
            return false; // break the each loop
          } catch {
            // Try parsing without trailing semicolons
            try {
              const cleaned = match[1].replace(/;?\s*$/, "");
              const parsed = JSON.parse(cleaned);
              serversData = parsed as EpisodeServers;
              return false;
            } catch {
              // Not valid JSON, continue searching
            }
          }
        }

        // Try with no var keyword
        const match2 = content.match(/(\{[\s\S]*?(?:server|code)[\s\S]*?\});/);
        if (match2 && match2[1]) {
          try {
            const parsed = JSON.parse(match2[1]);
            // Check if it has the expected structure (LAT, SUB, etc.)
            if (parsed.LAT || Object.values(parsed).some((v: unknown) => Array.isArray(v))) {
              serversData = parsed as EpisodeServers;
              return false;
            }
          } catch {
            // Continue searching
          }
        }
      }
    });

    return serversData;
  } catch (error) {
    console.error("Error scraping episode servers:", error);
    return null;
  }
}
