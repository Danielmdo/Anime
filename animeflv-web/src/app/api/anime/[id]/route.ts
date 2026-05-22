import { NextRequest, NextResponse } from "next/server";
import { getAnimeInfo } from "@/lib/animeflv";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const info = await getAnimeInfo(id);
    if (!info) {
      return NextResponse.json(
        { error: "Anime not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(info);
  } catch {
    return NextResponse.json(
      { error: "Error fetching anime info" },
      { status: 500 }
    );
  }
}
