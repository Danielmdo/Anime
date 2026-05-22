import { getAnimeInfo } from "@/lib/animeflv";
import { notFound } from "next/navigation";
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

  if (!anime) {
    notFound();
  }

  return <AnimeDetailClient anime={anime} animeId={id} />;
}
