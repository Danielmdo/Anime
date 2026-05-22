import { getAnimeInfo } from "@/lib/animeflv";
import { notFound } from "next/navigation";
import type { AnimeData } from "@/lib/types";
import WatchEpisodeClient from "./WatchEpisodeClient";

interface PageProps {
  params: Promise<{ id: string; num: string }>;
}

export default async function WatchEpisodePage({ params }: PageProps) {
  const { id, num } = await params;

  let anime: AnimeData | null = null;
  try {
    anime = await getAnimeInfo(id);
  } catch (error) {
    console.error("Error fetching anime:", error);
  }

  if (!anime) {
    notFound();
  }

  return <WatchEpisodeClient anime={anime} animeId={id} episodeNum={num} />;
}
