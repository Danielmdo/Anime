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

function loadCheerio(html: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cheerio = require("cheerio");
  return cheerio.load(html);
}

function extractSlugFromHref(href: string): string {
  return href
    .replace(/^https?:\/\/jkanime\.net\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
}

// ---------- search ----------

export async function searchAnime(
  query: string
): Promise<SearchAnimeResults | null> {
  try {
    const html = await fetchPage(
      `${BASE}/buscar/?q=${encodeURIComponent(query)}`
    );
    const $ = loadCheerio(html);

    const data: AnimeSearchResult[] = [];

    // Real structure: .page_directorio > .col > .anime__item > a[href] + .anime__item__text
    $(".page_directorio .anime__item").each((_i: number, el: any) => {
      const link = $(el).find(".anime__item__text h5 a");
      const href = link.attr("href") || "";
      const slug = extractSlugFromHref(href);
      const title = link.text().trim();

      // Image from data-setbg on .anime__item__pic
      const imgDiv = $(el).find(".anime__item__pic");
      const cover = imgDiv.attr("data-setbg") || "";

      // Status from first <li>
      const status = $(el)
        .find(".anime__item__text ul li:first-child")
        .text()
        .trim();

      // Type from li.anime
      const type = $(el)
        .find(".anime__item__text ul li.anime")
        .text()
        .trim();

      if (!slug || !title) return;

      data.push({
        id: slug,
        title,
        cover,
        type: type || "",
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
    const $ = loadCheerio(html);

    // Title is inside .anime_info h3
    const title = $(".anime_info h3").first().text().trim() || slug;

    // Cover image from .anime_pic img
    const cover = $(".anime_pic img").attr("src") || "";

    // Synopsis from p.scroll inside .anime_info
    const synopsis =
      $(".anime_info p.scroll").first().text().trim() ||
      $(".anime__details__text p").first().text().trim() ||
      "";

    // Parse structured info from .anime_data .card-bod ul li
    let type = "";
    let status = "";
    let episodeCount = 0;
    const genres: string[] = [];

    $(".anime_data .card-bod ul li").each((_i: number, el: any) => {
      const spanText = $(el).find("span").first().text().trim();
      const spanLower = spanText.toLowerCase();

      if (spanLower.includes("tipo")) {
        // e.g. "Tipo:" then "Serie"
        type = $(el).text().replace(spanText, "").trim();
      } else if (spanLower.includes("estado")) {
        // Status might be inside a nested div.enemision
        const innerDiv = $(el).find("div").first();
        status = innerDiv.length
          ? innerDiv.text().trim()
          : $(el).text().replace(spanText, "").trim();
      } else if (spanLower.includes("episodios")) {
        const epText = $(el).text().replace(spanText, "").trim();
        const epNum = parseInt(epText, 10);
        if (!isNaN(epNum)) episodeCount = epNum;
      } else if (spanLower.includes("genero")) {
        $(el).find("a").each((_j: number, a: any) => {
          const g = $(a).text().trim();
          if (g && !genres.includes(g)) genres.push(g);
        });
      }
    });

    // Rating
    const rating =
      $(".votar .vot").first().text().trim() || "";

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

    const result: EpisodeServers = {};

    // The streaming servers are individual assignments:
    //   video[0] = '<iframe src="https://jkanime.net/jkplayer/um?e=..."></iframe>';
    //   video[1] = '<iframe src="..."></iframe>';
    // We also need server names from the btn-show elements.

    // Get server names from btn-show links (filter out template literals)
    const serverNames: string[] = [];
    const nameMatch = html.match(
      /btn-show[^>]*>([^<]+)<\/a>/g
    );
    if (nameMatch) {
      for (const m of nameMatch) {
        const n = m.match(/>([^<]+)<\/a>/);
        if (n && n[1] && !n[1].includes("val.server")) {
          serverNames.push(n[1].trim());
        }
      }
    }

    // Extract iframe src from video[N] = '...' assignments
    const videoEntries = html.match(
      /video\[\d+\]\s*=\s*'[^']*'/g
    );

    if (videoEntries && videoEntries.length > 0) {
      const videoServers: VideoServer[] = videoEntries.map(
        (entry: string, idx: number) => {
          const srcMatch = entry.match(
            /src\s*=\s*["']([^"']+)["']/
          );
          let src = srcMatch ? srcMatch[1] : "";

          // Ensure full URL
          if (src && !src.startsWith("http")) {
            src = src.startsWith("//")
              ? `https:${src}`
              : `${BASE}${src}`;
          }

          const serverName = serverNames[idx] || `Server ${idx + 1}`;
          return {
            server: serverName.toLowerCase().replace(/\s+/g, "_"),
            title: serverName,
            ads: 0,
            allow_mobile: true,
            code: src,
          };
        }
      );

      result["SUB"] = videoServers;
    }

    // Fallback: try var servers (download links) if no video found
    if (Object.keys(result).length === 0) {
      const serversMatch = html.match(
        /var\s+servers\s*=\s*(\[[\s\S]*?\]);/
      );
      if (serversMatch && serversMatch[1]) {
        try {
          const servers = JSON.parse(serversMatch[1]);
          if (Array.isArray(servers) && servers.length > 0) {
            const videoServers: VideoServer[] = servers.map((s: any) => ({
              server: (s.server || "").toLowerCase().replace(/\s+/g, "_"),
              title: s.server || "Unknown",
              ads: 0,
              allow_mobile: true,
              code: s.remote
                ? Buffer.from(s.remote, "base64").toString("utf-8")
                : "",
            }));
            result["SUB"] = videoServers;
          }
        } catch {
          // Not valid JSON, skip
        }
      }
    }

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
    const $ = loadCheerio(html);

    const episodes: ChapterData[] = [];
    const seen = new Set<string>();

    // The trending section has episode cards inside .trending__anime
    // Structure: .card > a[href] > .d-thumb (with img) + .card-body > h5.strlimit.card-title
    $(".trending__anime .card a").each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      // Match: /{slug}/{number}/
      const epMatch = href.match(
        /jkanime\.net\/([a-zA-Z0-9-]+)\/(\d+)\/?$/
      );
      if (!epMatch) return;

      const slug = epMatch[1];
      const epNum = parseInt(epMatch[2], 10);
      if (isNaN(epNum) || epNum < 1) return;

      const key = `${slug}-${epNum}`;
      if (seen.has(key)) return;
      seen.add(key);

      // Title from h5.card-title or h5.strlimit inside the card body
      const title =
        $(el).find("h5.card-title, h5.strlimit").first().text().trim() ||
        slug.replace(/-/g, " ");

      // Cover from data-animepic on img
      const img = $(el).find("img").first();
      let cover = img.attr("data-animepic") || img.attr("src") || "";

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
    // Try directory page with emision filter
    const html = await fetchPage(`${BASE}/directorio/?estado=emision`);
    const $ = loadCheerio(html);

    const data: AnimeOnAirData[] = [];

    $(".page_directorio .anime__item").each((_i: number, el: any) => {
      const link = $(el).find(".anime__item__text h5 a");
      const href = link.attr("href") || "";
      const slug = extractSlugFromHref(href);
      const title = link.text().trim();
      const type = $(el)
        .find(".anime__item__text ul li.anime")
        .text()
        .trim();

      if (!slug || !title) return;

      data.push({
        title,
        type: type || "",
        id: slug,
        url: `${BASE}/${slug}/`,
      });
    });

    // Fallback: try parsing var animes JSON
    if (data.length === 0) {
      const match = html.match(/var\s+animes\s*=\s*(\{[\s\S]*?\});\s*(?:var|<)/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.data && Array.isArray(parsed.data)) {
            for (const a of parsed.data.slice(0, 30)) {
              data.push({
                title: a.title || "",
                type: a.tipo || a.type || "",
                id: a.slug || "",
                url: a.url || `${BASE}/${a.slug}/`,
              });
            }
          }
        } catch {
          // parse error, skip
        }
      }
    }

    return data;
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
    const params = new URLSearchParams();

    // Map genres to jkanime query param
    if (opts.genres && opts.genres.length > 0) {
      const genreMap: Record<string, string> = {
        "acción": "accion",
        accion: "accion",
        "artes marciales": "artes-marciales",
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
      const genreSlug = genreMap[opts.genres[0].toLowerCase().trim()];
      if (genreSlug) params.set("genero", genreSlug);
    }

    // Map types to jkanime query param
    if (opts.types && opts.types.length > 0) {
      const typeMap: Record<string, string> = {
        anime: "animes",
        ova: "ovas",
        película: "peliculas",
        pelicula: "peliculas",
        especial: "especiales",
      };
      const typeSlug = typeMap[opts.types[0].toLowerCase()];
      if (typeSlug) params.set("tipo", typeSlug);
    }

    // Map statuses to jkanime query param
    if (opts.statuses && opts.statuses.length > 0) {
      const statusMap: Record<string, string> = {
        "en emision": "emision",
        "en emisión": "emision",
        finalizado: "finalizados",
        proximamente: "estrenos",
      };
      const statusKey = opts.statuses[0].toLowerCase().replace("ó", "o");
      const statusSlug = statusMap[statusKey];
      if (statusSlug) params.set("estado", statusSlug);
    }

    // Pagination
    const page = opts.page || 1;
    if (page > 1) params.set("p", String(page));

    const qs = params.toString();
    const url = qs ? `${BASE}/directorio/?${qs}` : `${BASE}/directorio/`;

    const html = await fetchPage(url);
    const $ = loadCheerio(html);

    const animeData: AnimeSearchResult[] = [];

    $(".page_directorio .anime__item").each((_i: number, el: any) => {
      const link = $(el).find(".anime__item__text h5 a");
      const href = link.attr("href") || "";
      const slug = extractSlugFromHref(href);
      const title = link.text().trim();
      const cover = $(el).find(".anime__item__pic").attr("data-setbg") || "";
      const type = $(el).find(".anime__item__text ul li.anime").text().trim();

      if (!slug || !title) return;

      animeData.push({
        id: slug,
        title,
        cover,
        type: type || "",
        synopsis: "",
        rating: "",
        url: `${BASE}/${slug}/`,
      });
    });

    // Build pagination from the page numbers
    let previousPage: string | null = null;
    let nextPage: string | null = null;
    let foundPages = 1;

    // Check for pagination links
    const paginationLinks = $(".pagination a, .page-link");
    paginationLinks.each((_i: number, el: any) => {
      const text = $(el).text().trim();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > foundPages) foundPages = num;
    });

    if (page > 1) previousPage = String(page - 1);
    if (animeData.length >= 24) nextPage = String(page + 1);

    return {
      previousPage,
      nextPage,
      foundPages,
      data: animeData,
    };
  } catch (error) {
    console.error("Error filtering anime on jkanime:", error);
    return null;
  }
}
