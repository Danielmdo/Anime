import type {
  AnimeData,
  AnimeSearchResult,
  SearchAnimeResults,
  ChapterData,
  AnimeOnAirData,
  VideoServer,
  EpisodeServers,
  FilterOptions,
} from "./types";

const BASE = "https://animev1.com";
const TIMEOUT = 15000;

async function fetchPage(url: string, timeout = TIMEOUT): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  } finally {
    clearTimeout(id);
  }
}

// ---------- helpers ----------

function extractEpisodeNum(url: string): number | null {
  const m = url.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

/** Map common animev1 genre names to their numeric IDs so filters work */
const GENRE_IDS: Record<string, number> = {
  acciÓn: 1,
  "artes marciales": 2,
  aventuras: 3,
  carreras: 4,
  "ciencia ficción": 5,
  "ciencia ficcion": 5,
  comedia: 6,
  demencia: 7,
  demonios: 8,
  deportes: 9,
  drama: 10,
  ecchi: 11,
  escolares: 12,
  espacial: 13,
  fantasía: 14,
  fantasia: 14,
  harem: 15,
  histórico: 16,
  historico: 16,
  infantil: 17,
  josei: 18,
  juegos: 19,
  magia: 20,
  mecha: 21,
  militar: 22,
  misterio: 23,
  música: 24,
  musica: 24,
  parodia: 25,
  policía: 26,
  policia: 26,
  psicológico: 27,
  psicologico: 27,
  "recuentos de la vida": 28,
  romance: 29,
  samurai: 30,
  seinen: 31,
  shoujo: 32,
  shounen: 33,
  sobrenatural: 34,
  superpoderes: 35,
  suspenso: 36,
  terror: 37,
  vampiros: 38,
  yaoi: 39,
  yuri: 40,
};

function getGenreId(name: string): number | null {
  return GENRE_IDS[name.toLowerCase().trim()] ?? null;
}

// ---------- search ----------

export async function searchAnime(query: string): Promise<SearchAnimeResults | null> {
  try {
    const html = await fetchPage(`${BASE}/directorio/anime?q=${encodeURIComponent(query)}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const data: AnimeSearchResult[] = [];

    $("ul.grid-animes.directorio > li").each((_i: number, el: any) => {
      const link = $(el).find("article > a");
      const href = link.attr("href") || "";
      const id = href.replace(/^\//, "").replace(/^latino\//, "");
      const title = link.find("> p").first().text().trim();
      const img = link.find("figure .main-img img");
      const cover = img.attr("src") || "";
      const type = link.find("figure span.tipo").text().trim();

      if (!id || !title) return;

      data.push({
        id,
        title,
        cover,
        type,
        synopsis: "",
        rating: "",
        url: `${BASE}${href}`,
      });
    });

    // Fallback: generic article card layout for mobile/responsive
    if (data.length === 0) {
      $("li article a[href^='/']").each((_i: number, el: any) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith("/static/") || href.startsWith("/media/")) return;
        const id = href.replace(/^\//, "").replace(/^latino\//, "");
        const title = $(el).find("p").first().text().trim() || $(el).find("h2, h3").first().text().trim();
        const img = $(el).find("img").first();
        const cover = img.attr("src") || "";
        if (!id || !title || data.some((d) => d.id === id)) return;

        data.push({
          id,
          title,
          cover,
          type: $(el).find(".tipo").first().text().trim(),
          synopsis: "",
          rating: "",
          url: `${BASE}${href}`,
        });
      });
    }

    return {
      previousPage: null,
      nextPage: null,
      foundPages: 1,
      data,
    };
  } catch (error) {
    console.error("Error searching animev1:", error);
    return null;
  }
}

// ---------- parse episode count ----------

async function countEpisodes(slug: string): Promise<number> {
  let total = 0;
  for (const offset of [0, 16, 32]) {
    try {
      const epHtml = await fetchPage(
        `${BASE}/latino/${slug}?id=${slug}&load=episodes&start=${offset}`,
        10000
      );
      const count = (epHtml.match(/<article\s+class="group\/item/g) || []).length;
      total += count;
      if (count < 16) break; // no more pages
    } catch {
      break;
    }
  }
  return total;
}

// ---------- anime info ----------

export async function getAnimeInfo(slug: string): Promise<AnimeData | null> {
  try {
    // Try /latino/<slug> first (dubbed), then /<slug> (subbed)
    let html: string;
    try {
      html = await fetchPage(`${BASE}/latino/${slug}`);
    } catch {
      try {
        html = await fetchPage(`${BASE}/${slug}`);
      } catch {
        throw new Error(`Could not fetch anime page for slug: ${slug}`);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const title =
      $("h1.line-clamp-2").first().text().trim() ||
      $("h1").first().text().trim();

    const cover =
      $("#anime_image").attr("src") ||
      $("img[id*='anime'], img[id*='cover']").attr("src") ||
      $("figure img").first().attr("src") ||
      "";

    const synopsis = $("div.entry").first().text().trim() || "";

    // Genres — anchor tags with genre href
    const genres: string[] = [];
    $("a[href*='genero=']").each((_i: number, el: any) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });

    // Type — shown in a span at the top of the info column
    const type =
      $(".flex.flex-wrap span, .flex span:contains('Anime'), .flex span:contains('OVA')")
        .first()
        .text()
        .trim() || "";

    // Status — button with known status text
    let status = "";
    $("button:contains('Finalizado'), button:contains('En emision'), button:contains('Proximamente'), button:contains('En emisión')")
      .each((_i: number, el: any) => {
        const txt = $(el).text().trim();
        if (["Finalizado", "En emision", "Proximamente", "En emisión"].includes(txt)) {
          status = txt;
          return false;
        }
      });

    // Rating
    const ratingEl = $("div.text-2xl.font-bold.text-lead").first();
    const rating = ratingEl.text().trim() || "";

    // Episode count
    const totalEpisodes = await countEpisodes(slug);

    return {
      title,
      alternative_titles: [],
      status,
      rating,
      type,
      cover: cover ? cover.replace(/\/thumb\//, "/") : cover,
      synopsis,
      genres,
      episodes: totalEpisodes,
      url: `${BASE}/latino/${slug}`,
    };
  } catch (error) {
    console.error("Error getting anime info from animev1:", error);
    return null;
  }
}

// ---------- episode servers ----------

export async function getEpisodeServers(
  slug: string,
  episodeNum: number
): Promise<EpisodeServers | null> {
  try {
    const html = await fetchPage(`${BASE}/ver/${slug}-${episodeNum}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    // Extract server names from the server list buttons
    const serverNames: string[] = [];
    $("button.episode-btn, ul.episode-page__servers-list button").each(
      (_i: number, el: any) => {
        const name = $(el).text().trim();
        if (name) serverNames.push(name);
      }
    );

    const result: EpisodeServers = {};
    const groupKey = "SUB";

    // Parse tabsArray from script tags — handle escaped quotes
    $("script").each((_i: number, el: any) => {
      const content = $(el).html() || "";
      if (!content.includes("tabsArray")) return;

      // Match: tabsArray['N'] = "...HTML..." (handles escaped quotes \")
      const regex = /tabsArray\s*\[\s*'(\d+)'\s*\]\s*=\s*"((?:[^"\\]|\\.)*)"/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const idx = parseInt(match[1], 10);
        let iframeHtml = match[2]
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\//g, "/");

        // Extract src URL from iframe
        const srcMatch = iframeHtml.match(/src='([^']+)'/);
        const code = srcMatch ? srcMatch[1] : iframeHtml;

        const serverName = serverNames[idx - 1] || `Server ${idx}`;
        const server: VideoServer = {
          server: serverName.toLowerCase().replace(/\s+/g, "_"),
          title: serverName,
          ads: 0,
          allow_mobile: true,
          code,
        };

        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey]!.push(server);
      }

      // Fallback: try to find script with data-index attributes on buttons
      if (!result[groupKey] || result[groupKey]!.length === 0) {
        $("button[data-index]").each((_bi: number, btnEl: any) => {
          const dataIdx = $(btnEl).attr("data-index");
          if (dataIdx === undefined) return;
          const idx = parseInt(dataIdx, 10);
          const name = $(btnEl).text().trim() || `Server ${idx + 1}`;

          // Look for iframe content in nearby elements
          const parent = $(btnEl).closest("li, div");
          const iframe = parent.find("iframe").first();
          const iframeSrc = iframe.attr("src");

          if (iframeSrc) {
            const server: VideoServer = {
              server: name.toLowerCase().replace(/\s+/g, "_"),
              title: name,
              ads: 0,
              allow_mobile: true,
              code: iframeSrc,
            };
            if (!result[groupKey]) result[groupKey] = [];
            // Avoid duplicates
            if (!result[groupKey]!.some((s) => s.code === server.code)) {
              result[groupKey]!.push(server);
            }
          }
        });
      }
    });

    if (!result[groupKey] || result[groupKey]!.length === 0) return null;
    return result;
  } catch (error) {
    console.error("Error getting episode servers from animev1:", error);
    return null;
  }
}

// ---------- latest episodes ----------

export async function getLatestEpisodes(): Promise<ChapterData[]> {
  try {
    const html = await fetchPage(`${BASE}/`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const episodes: ChapterData[] = [];
    const seen = new Set<string>();

    // Find all episode links (/ver/...) across the page
    $("a[href*='/ver/']").each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      if (!href.startsWith("/ver/") || seen.has(href)) return;

      const epNum = extractEpisodeNum(href);
      const slug = href.replace("/ver/", "").replace(/-?\d+$/, "");

      if (!slug || !epNum) return;
      seen.add(href);

      // Get title from the nearest parent article/card, fallback to slug
      const parent = $(el).closest("article, .card, div");
      const title =
        parent.find("h1, h2, h3, .title, .name").first().text().trim() ||
        slug.replace(/-/g, " ");

      // Cover image from nearest img sibling/parent
      const img = parent.find("img").first();
      let cover = img.attr("src") || "";

      // Fix relative URLs
      if (cover && !cover.startsWith("http")) {
        cover = cover.startsWith("//") ? `https:${cover}` : `${BASE}${cover}`;
      }

      episodes.push({
        title,
        chapter: epNum,
        cover,
        url: `${BASE}${href}`,
      });
    });

    // Deduplicate by title+chapter
    const unique: ChapterData[] = [];
    const titleSeen = new Set<string>();
    for (const ep of episodes) {
      const key = `${ep.title}-${ep.chapter}`;
      if (!titleSeen.has(key)) {
        titleSeen.add(key);
        unique.push(ep);
      }
      if (unique.length >= 50) break;
    }

    return unique;
  } catch (error) {
    console.error("Error getting latest episodes from animev1:", error);
    return [];
  }
}

// ---------- on air ----------

export async function getOnAir(): Promise<AnimeOnAirData[]> {
  try {
    const html = await fetchPage(`${BASE}/directorio/anime?estado=2`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const results: AnimeOnAirData[] = [];

    $("ul.grid-animes.directorio > li").each((_i: number, el: any) => {
      const link = $(el).find("article > a");
      const href = link.attr("href") || "";
      const id = href.replace(/^\//, "").replace(/^latino\//, "");
      const title = link.find("> p").first().text().trim();
      const typeEl = link.find("figure span.tipo").text().trim();
      const status = link.find("figure .figure-title p.gray").text().trim().toLowerCase();

      if (!id || !title) return;
      if (!status.includes("emision") && !status.includes("emisi")) return;

      results.push({
        title,
        type: typeEl,
        id,
        url: `${BASE}${href}`,
      });
    });

    // Fallback: also get featured anime from homepage
    if (results.length === 0) {
      try {
        const homeHtml = await fetchPage(`${BASE}/`);
        const $home = cheerio.load(homeHtml);
        $home("article").each((_i: number, el: any) => {
          const text = $home(el).text();
          const title = $home(el).find("h1, h2, h3").first().text().trim();
          const link = $home(el).find("a[href^='/']").first().attr("href") || "";
          const id = link.replace(/^\//, "").replace(/^latino\//, "");
          if (!title || !id || id.includes("static/")) return;
          if (!text.includes("En emision") && !text.includes("En emisión")) return;
          if (results.some((r) => r.id === id)) return;

          results.push({
            title,
            type: "",
            id,
            url: `${BASE}${link}`,
          });
        });
      } catch {
        // ignore
      }
    }

    return results.slice(0, 30);
  } catch (error) {
    console.error("Error getting on-air from animev1:", error);
    return [];
  }
}

// ---------- filter / search by filter ----------

export async function searchByFilter(
  opts: FilterOptions
): Promise<SearchAnimeResults | null> {
  try {
    // Build URL with filter params where possible
    const params = new URLSearchParams();

    // Page number (animev1 uses ?p=N, 1-based)
    const page = opts.page || 1;
    if (page > 1) params.set("p", String(page));

    // Map genres to animev1 IDs (first genre only, since animev1 uses single-select)
    if (opts.genres && opts.genres.length > 0) {
      const genreId = getGenreId(opts.genres[0]);
      if (genreId) params.set("genero", String(genreId));
    }

    // Map statuses to animev1 IDs (first status only)
    if (opts.statuses && opts.statuses.length > 0) {
      const statusMap: Record<string, string> = {
        "en emision": "2",
        "en emisión": "2",
        finalizado: "1",
        proximamente: "3",
      };
      const statusKey = opts.statuses[0].toLowerCase().replace("ó", "o");
      const statusId = statusMap[statusKey];
      if (statusId) params.set("estado", statusId);
    }

    // Map types (animev1 uses tipo parameter with text values)
    if (opts.types && opts.types.length > 0) {
      const typeMap: Record<string, string> = {
        anime: "anime",
        ova: "ova",
        película: "pelicula",
        pelicula: "pelicula",
        especial: "especial",
      };
      const typeKey = opts.types[0].toLowerCase();
      const typeVal = typeMap[typeKey];
      if (typeVal) params.set("tipo", typeVal);
    }

    const qs = params.toString();
    const url = qs ? `${BASE}/directorio/anime?${qs}` : `${BASE}/directorio/anime`;

    const html = await fetchPage(url);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const data: AnimeSearchResult[] = [];

    $("ul.grid-animes.directorio > li").each((_i: number, el: any) => {
      const link = $(el).find("article > a");
      const href = link.attr("href") || "";
      const id = href.replace(/^\//, "").replace(/^latino\//, "");
      const title = link.find("> p").first().text().trim();
      const img = link.find("figure .main-img img");
      const cover = img.attr("src") || "";
      const type = link.find("figure span.tipo").text().trim();
      const statusText = link.find("figure .figure-title p.gray").text().trim();

      if (!id || !title) return;

      // If types requested, filter client-side
      if (opts.types && opts.types.length > 0 && type) {
        const typeMatch = opts.types.some(
          (t) => type.toLowerCase().includes(t.toLowerCase())
        );
        if (!typeMatch) return;
      }

      // If multiple statuses, filter client-side
      if (opts.statuses && opts.statuses.length > 1 && statusText) {
        const statusMatch = opts.statuses.some(
          (s) => statusText.toLowerCase().includes(s.toLowerCase().replace("ó", "o"))
        );
        if (!statusMatch) return;
      }

      data.push({
        id,
        title,
        cover,
        type,
        synopsis: "",
        rating: "",
        url: `${BASE}${href}`,
      });
    });

    // Parse pagination from the page
    let previousPage: string | null = null;
    let nextPage: string | null = null;
    let foundPages = 1;

    const pageLinks: number[] = [];
    $("a.page-link[href*='?p=']").each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      const pageMatch = href.match(/[?&]p=(\d+)/);
      if (pageMatch) {
        const p = parseInt(pageMatch[1], 10);
        if (!isNaN(p) && !pageLinks.includes(p)) {
          pageLinks.push(p);
        }
      }
    });

    if (pageLinks.length > 0) {
      foundPages = Math.max(...pageLinks);
      if (page > 1) previousPage = String(page - 1);
      if (page < foundPages) nextPage = String(page + 1);
    } else {
      // If no pagination found, we might be on the only page
      const allLinks = $("a.page-link").length;
      if (allLinks === 0) {
        foundPages = 1;
      } else {
        // Try to find highest page from any href
        $("a.page-link").each((_i: number, el: any) => {
          const href = $(el).attr("href") || "";
          const m = href.match(/[?&]p=(\d+)/);
          if (m) {
            const p = parseInt(m[1], 10);
            if (!isNaN(p) && p > foundPages) foundPages = p;
          }
        });
        if (page > 1) previousPage = String(page - 1);
        if (page < foundPages) nextPage = String(page + 1);
      }
    }

    return {
      previousPage,
      nextPage,
      foundPages,
      data,
    };
  } catch (error) {
    console.error("Error filtering anime on animev1:", error);
    return null;
  }
}
