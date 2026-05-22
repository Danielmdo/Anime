import { getLatestEpisodes, getOnAir } from "@/lib/animeflv";
import type { ChapterData, AnimeOnAirData } from "@/lib/types";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  let latest: ChapterData[] = [];
  let onAir: AnimeOnAirData[] = [];

  try {
    const [latestData, onAirData] = await Promise.all([
      getLatestEpisodes(),
      getOnAir(),
    ]);
    latest = latestData || [];
    onAir = onAirData || [];
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return <HomeClient latest={latest} onAir={onAir} />;
}
