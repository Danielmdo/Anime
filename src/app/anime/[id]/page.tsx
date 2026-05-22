import { getAnimeInfo } from "@/lib/animeflv";
import type { AnimeData } from "@/lib/types";
import AnimeDetailClient from "./AnimeDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { id } = await params;
  let anime: AnimeData | null = null;

  try {
    anime = await getAnimeInfo(id);
  } catch (error) {
    console.error("Error fetching anime:", error);
  }

  return <AnimeDetailClient anime={anime} animeId={id} />;
}
