import { NextResponse } from "next/server";
import { getLatestEpisodes } from "@/lib/animeflv";

export async function GET() {
  try {
    const episodes = await getLatestEpisodes();
    return NextResponse.json({ data: episodes });
  } catch {
    return NextResponse.json(
      { error: "Error fetching latest episodes" },
      { status: 500 }
    );
  }
}
