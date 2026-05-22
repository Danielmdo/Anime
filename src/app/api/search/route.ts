import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/animeflv";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }
  try {
    const results = await searchAnime(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Error searching anime" },
      { status: 500 }
    );
  }
}
