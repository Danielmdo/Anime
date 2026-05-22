import type { EpisodeServers } from "./types";

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
 * Extract video server data from an AnimeFLV episode page.
 * Uses cloudscraper (same as animeflv-api) to bypass Cloudflare.
 */
export async function getEpisodeServers(
  animeId: string,
  episodeNum: number
): Promise<EpisodeServers | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cloudscraper = require("cloudscraper");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");

    const url = `https://www3.animeflv.net/ver/${animeId}-${episodeNum}`;

    const html: string = await withTimeout(
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
