import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/places";

/**
 * Town lookup for the place fields. Open to everyone because the free birth
 * chart needs it; it only ever returns names from the public gazetteer.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ places: searchPlaces(q.slice(0, 80)) }, { headers: { "cache-control": "public, max-age=86400" } });
}
