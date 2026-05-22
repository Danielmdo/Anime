import { NextRequest, NextResponse } from "next/server";
import { getEpisodeServers } from "@/lib/scraper";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  const { id, num } = await params;
  const episodeNum = parseInt(num);

  if (isNaN(episodeNum) || episodeNum < 1) {
    return NextResponse.json(
      { error: "Invalid episode number" },
      { status: 400 }
    );
  }

  try {
    const servers = await getEpisodeServers(id, episodeNum);
    if (!servers) {
      return NextResponse.json(
        { error: "Could not fetch video servers" },
        { status: 404 }
      );
    }
    return NextResponse.json(servers);
  } catch (error) {
    console.error("Error fetching episode servers:", error);
    return NextResponse.json(
      { error: "Error fetching episode servers" },
      { status: 500 }
    );
  }
}
