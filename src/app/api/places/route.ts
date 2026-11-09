import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPlaces } from "@/lib/places";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ places: [] }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ places: searchPlaces(q.slice(0, 80)) });
}
