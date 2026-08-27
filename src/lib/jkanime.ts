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

const BASE = "https://jkanime.net";
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

async function fetchJSON(url: string, timeout = TIMEOUT): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*;q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  } finally {
    clearTimeout(id);
  }
}

// ---------- helpers ----------

function extractEpisodeNum(url: string): number | null {
  // jkanime URLs: /anime-slug/123/
  const m = url.match(/\/(\d+)\/?$/);
  return m ? parseInt(m[1], 10) : null;
}

function extractSlugFromHref(href: string): string {
  // Remove leading slash and trailing slash/slash+number
  return href
    .replace(/^\//, "")
    .replace(/\/\d+\/?$/, "")
    .replace(/\/$/, "");
}

/** Map common anime genre names to jkanime filter path segments */
const GENRE_MAP: Record<string, string> = {
  acción: "accion",
  accion: "accion",
  "artes marciales": "artes-marciales",
  aventuras: "aventura",
  aventura: "aventura",
  carreras: "autos",
  "ciencia ficción": "sci-fi",
  "ciencia ficcion": "sci-fi",
  comedia: "comedia",
  demencia: "dementia",
  demonios: "demonios",
  deportes: "deportes",
  drama: "drama",
  ecchi: "ecchi",
  escolares: "colegial",
  espacial: "space",
  fantasía: "fantasia",
  fantasia: "fantasia",
  harem: "harem",
  histórico: "historico",
  historico: "historico",
  infantil: "nios",
  josei: "josei",
  juegos: "juegos",
  magia: "magia",
  mecha: "mecha",
  militar: "militar",
  misterio: "misterio",
  música: "musica",
  musica: "musica",
  parodia: "parodia",
  policía: "policial",
  policia: "policial",
  psicológico: "psicologico",
  psicologico: "psicologico",
  "recuentos de la vida": "cosas-de-la-vida",
  romance: "romance",
  samurai: "samurai",
  seinen: "seinen",
  shoujo: "shoujo",
  shounen: "shounen",
  sobrenatural: "sobrenatural",
  superpoderes: "super-poderes",
  suspenso: "thriller",
  terror: "terror",
  vampiros: "vampiros",
  yaoi: "yaoi",
  yuri: "yuri",
};

function getGenreSlug(name: string): string | null {
  return GENRE_MAP[name.toLowerCase().trim()] ?? null;
}

// ---------- search ----------

export async function searchAnime(query: string): Promise<SearchAnimeResults | null> {
  try {
    // Try the AJAX search endpoint first (returns JSON)
    try {
      const jsonData = await fetchJSON(
        `${BASE}/ajax/ajax_search/?q=${encodeURIComponent(query)}`
      );

      if (jsonData && jsonData.animes && Array.isArray(jsonData.animes)) {
        const data: AnimeSearchResult[] = jsonData.animes.map((a: any) => ({
          id: a.slug || "",
          title: a.title || "",
          cover: a.image || a.thumbnail || "",
          type: jsonData.anime_types?.[a.type] || a.type || "",
          synopsis: a.synopsis || "",
          rating: "",
          url: `${BASE}/${a.slug}/`,
        }));

        return {
          previousPage: null,
          nextPage: null,
          foundPages: 1,
          data,
        };
      }
    } catch {
      // Fall through to HTML scraping
    }

    // Fallback: scrape the search page HTML
    const html = await fetchPage(`${BASE}/buscar/?q=${encodeURIComponent(query)}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const data: AnimeSearchResult[] = [];

    $(".card").each((_i: number, el: any) => {
      const titleEl = $(el).find(".card-title a");
      const href = titleEl.attr("href") || "";
      const slug = extractSlugFromHref(href);
      const title = titleEl.attr("title") || titleEl.text().trim();
      const img = $(el).find(".img-fluid").attr("src") || "";
      const type = $(el).find("p.card-txt").text().trim() || "";

      if (!slug || !title) return;

      data.push({
        id: slug,
        title,
        cover: img,
        type,
        synopsis: "",
        rating: "",
        url: `${BASE}/${slug}/`,
      });
    });

    return {
      previousPage: null,
      nextPage: null,
      foundPages: 1,
      data,
    };
  } catch (error) {
    console.error("Error searching jkanime:", error);
    return null;
  }
}

// ---------- anime info ----------

export async function getAnimeInfo(slug: string): Promise<AnimeData | null> {
  try {
    const html = await fetchPage(`${BASE}/${slug}/`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const title =
      $("h1.title-anime, h1.fs-title, h1").first().text().trim() || slug;

    const cover =
      $(".anime__item__pic img, .anime-cover img, .img-cover img, img.anime-img, img.ficha-img, .fondo-anime img")
        .first()
        .attr("src") || "";

    const synopsis =
      $(".sinopsis p, .description p, .synopsis, .anime__item__text p")
        .first()
        .text()
        .trim() || "";

    // Genres from the info panel
    const genres: string[] = [];
    $(".aninfo ul li a[href*='genero'], .aninfo a[href*='genero'], a[href*='/directorio/']").each(
      (_i: number, el: any) => {
        const g = $(el).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      }
    );

    // Parse the .aninfo ul li elements for structured data
    let type = "";
    let status = "";
    let rating = "";
    let episodeCount = 0;

    $(".aninfo ul li").each((_i: number, el: any) => {
      const text = $(el).text().trim();
      const spanText = $(el).find("span").first().text().trim().toLowerCase();

      if (spanText.includes("tipo")) {
        type = text.replace(spanText, "").replace(":", "").trim();
      } else if (spanText.includes("estado")) {
        status = text.replace(spanText, "").replace(":", "").trim();
      } else if (spanText.includes("episodios")) {
        const epText = text.replace(spanText, "").replace(":", "").trim();
        const epNum = parseInt(epText, 10);
        if (!isNaN(epNum)) episodeCount = epNum;
      }
    });

    // Fallbacks for type and status
    if (!type) {
      type =
        $('li:contains("Tipo:")').text().replace("Tipo:", "").trim() ||
        $(".badge-type, .type-badge").first().text().trim() ||
        "";
    }
    if (!status) {
      status =
        $('li:contains("Estado:")').text().replace("Estado:", "").trim() ||
        "";
    }

    // Rating
    rating =
      $(".votos .rating, .anime-rating, .score").first().text().trim() ||
      $(".votos span").first().text().trim() ||
      "";

    return {
      title,
      alternative_titles: [],
      status,
      rating,
      type,
      cover,
      synopsis,
      genres,
      episodes: episodeCount,
      url: `${BASE}/${slug}/`,
    };
  } catch (error) {
    console.error("Error getting anime info from jkanime:", error);
    return null;
  }
}

// ---------- episode servers ----------

export async function getEpisodeServers(
  slug: string,
  episodeNum: number
): Promise<EpisodeServers | null> {
  try {
    const html = await fetchPage(`${BASE}/${slug}/${episodeNum}/`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const result: EpisodeServers = {};

    // Look for the var servers = [...] or var videos = [...] script
    $("script").each((_i: number, el: any) => {
      const content = $(el).html() || "";

      // Try var servers = [{...}]
      let serversMatch = content.match(/var\s+servers\s*=\s*(\[[\s\S]*?\]);/);
      if (serversMatch && serversMatch[1]) {
        try {
          const servers = JSON.parse(serversMatch[1]);
          if (Array.isArray(servers)) {
            const videoServers: VideoServer[] = servers.map((s: any) => ({
              server: (s.server || "").toLowerCase().replace(/\s+/g, "_"),
              title: s.server || "Unknown",
              ads: 0,
              allow_mobile: true,
              code: s.remote
                ? `${BASE}/c1.php?u=${encodeURIComponent(s.remote)}&s=${encodeURIComponent((s.server || "").toLowerCase())}`
                : "",
            }));
            result["SUB"] = videoServers;
            return false; // break
          }
        } catch {
          // Not valid JSON, continue
        }
      }

      // Try var videos = {...} (AnimeFLV-style fallback)
      let videosMatch = content.match(/var\s+videos\s*=\s*(\{[\s\S]*?\});/);
      if (videosMatch && videosMatch[1]) {
        try {
          const parsed = JSON.parse(videosMatch[1]);
          if (parsed.SUB || parsed.LAT || Object.values(parsed).some((v: unknown) => Array.isArray(v))) {
            Object.assign(result, parsed);
            return false; // break
          }
        } catch {
          // continue
        }
      }

      // Try iframes in the episode page directly
      const iframes = $("iframe[src]").toArray();
      if (iframes.length > 0 && Object.keys(result).length === 0) {
        const videoServers: VideoServer[] = [];
        $(iframes).each((_ii: number, iframe: any) => {
          const src = $(iframe).attr("src") || "";
          if (src && !src.includes("jkanime.net/c1.php")) {
            videoServers.push({
              server: "direct",
              title: "Direct",
              ads: 0,
              allow_mobile: true,
              code: src,
            });
          }
        });
        if (videoServers.length > 0) {
          result["SUB"] = videoServers;
          return false;
        }
      }
    });

    if (Object.keys(result).length === 0) return null;
    return result;
  } catch (error) {
    console.error("Error getting episode servers from jkanime:", error);
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

    // jkanime homepage has episode links in schedule/carousel sections
    // Look for links with pattern /anime-slug/episode-number/
    $("a[href]").each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      // Match pattern like /one-piece/1175/ or one-piece/1175/
      const epMatch = href.match(/^\/?([a-z0-9-]+)\/(\d+)\/?$/);
      if (!epMatch) return;

      const slug = epMatch[1];
      const epNum = parseInt(epMatch[2], 10);
      if (isNaN(epNum) || epNum < 1) return;

      const key = `${slug}-${epNum}`;
      if (seen.has(key)) return;
      seen.add(key);

      // Get title from parent element
      const parent = $(el).closest(".card, .box, div, li");
      const title =
        parent.find("h3, h4, h5, .title, .name, p").first().text().trim() ||
        slug.replace(/-/g, " ");

      // Get cover image
      const img = parent.find("img").first();
      let cover = img.attr("src") || img.attr("data-setbg") || "";

      if (cover && !cover.startsWith("http")) {
        cover = cover.startsWith("//")
          ? `https:${cover}`
          : `${BASE}${cover}`;
      }

      episodes.push({
        title,
        chapter: epNum,
        cover,
        url: `${BASE}/${slug}/${epNum}/`,
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
    console.error("Error getting latest episodes from jkanime:", error);
    return [];
  }
}

// ---------- on air ----------

export async function getOnAir(): Promise<AnimeOnAirData[]> {
  try {
    // Use the directorio filter for "emision" state
    const html = await fetchPage(`${BASE}/directorio/emision/`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const results: AnimeOnAirData[] = [];

    $(".card, .page_directorio .card").each((_i: number, el: any) => {
      const titleEl = $(el).find(".card-title a");
      const href = titleEl.attr("href") || "";
      const slug = extractSlugFromHref(href);
      const title = titleEl.attr("title") || titleEl.text().trim();
      const type = $(el).find("p.card-txt").text().trim();

      if (!slug || !title) return;

      results.push({
        title,
        type,
        id: slug,
        url: `${BASE}/${slug}/`,
      });
    });

    return results.slice(0, 30);
  } catch (error) {
    console.error("Error getting on-air from jkanime:", error);
    return [];
  }
}

// ---------- filter / search by filter ----------

export async function searchByFilter(
  opts: FilterOptions
): Promise<SearchAnimeResults | null> {
  try {
    // Build the directorio path with filter segments
    const pathParts: string[] = [];

    // Map genres to jkanime slug (first genre only)
    if (opts.genres && opts.genres.length > 0) {
      const genreSlug = getGenreSlug(opts.genres[0]);
      if (genreSlug) pathParts.push(genreSlug);
    }

    // Map types to jkanime slug (first type only)
    if (opts.types && opts.types.length > 0) {
      const typeMap: Record<string, string> = {
        anime: "animes",
        ova: "ovas",
        película: "peliculas",
        pelicula: "peliculas",
        especial: "especiales",
      };
      const typeKey = opts.types[0].toLowerCase();
      const typeSlug = typeMap[typeKey];
      if (typeSlug) pathParts.push(typeSlug);
    }

    // Map statuses to jkanime slug (first status only)
    if (opts.statuses && opts.statuses.length > 0) {
      const statusMap: Record<string, string> = {
        "en emision": "emision",
        "en emisión": "emision",
        finalizado: "finalizados",
        proximamente: "estrenos",
      };
      const statusKey = opts.statuses[0].toLowerCase().replace("ó", "o");
      const statusSlug = statusMap[statusKey];
      if (statusSlug) pathParts.push(statusSlug);
    }

    const pathSegment = pathParts.length > 0 ? pathParts.join("/") + "/" : "";
    const page = opts.page || 1;
    const pageParam = page > 1 ? `?pg=${page}` : "";
    const url = `${BASE}/directorio/${pathSegment}${pageParam}`;

    const html = await fetchPage(url);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const data: AnimeSearchResult[] = [];

    $(".card, .page_directorio .card").each((_i: number, el: any) => {
      const titleEl = $(el).find(".card-title a");
      const href = titleEl.attr("href") || "";
      const slug = extractSlugFromHref(href);
      const title = titleEl.attr("title") || titleEl.text().trim();
      const img = $(el).find(".img-fluid").attr("src") || "";
      const type = $(el).find("p.card-txt").text().trim() || "";
      const synopsis = $(el).find(".synopsis").text().trim() || "";

      if (!slug || !title) return;

      data.push({
        id: slug,
        title,
        cover: img,
        type,
        synopsis,
        rating: "",
        url: `${BASE}/${slug}/`,
      });
    });

    // Parse pagination
    let previousPage: string | null = null;
    let nextPage: string | null = null;
    let foundPages = 1;

    const nextPageLink = $(".text.nav-next, a.nav-next, .pagination .next a").attr("href");
    const prevPageLink = $(".text.nav-prev, a.nav-prev, .pagination .prev a").attr("href");

    if (nextPageLink) nextPage = String(page + 1);
    if (prevPageLink) previousPage = String(page - 1);
    if (page > 1 || nextPage) foundPages = Math.max(foundPages, page + (nextPage ? 1 : 0));

    // Also check for page numbers in pagination links
    $("a[href*='?pg=']").each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      const m = href.match(/[?&]pg=(\d+)/);
      if (m) {
        const p = parseInt(m[1], 10);
        if (!isNaN(p) && p > foundPages) foundPages = p;
      }
    });

    return {
      previousPage,
      nextPage,
      foundPages,
      data,
    };
  } catch (error) {
    console.error("Error filtering anime on jkanime:", error);
    return null;
  }
}
