import { NextRequest, NextResponse } from "next/server";
import { searchByFilter } from "@/lib/animeflv";

export async function GET(request: NextRequest) {
  const types = request.nextUrl.searchParams.get("types");
  const genres = request.nextUrl.searchParams.get("genres");
  const statuses = request.nextUrl.searchParams.get("statuses");

  try {
    const results = await searchByFilter({
      types: types ? types.split(",") : undefined,
      genres: genres ? genres.split(",") : undefined,
      statuses: statuses ? statuses.split(",") : undefined,
    });
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Error filtering anime" },
      { status: 500 }
    );
  }
}
