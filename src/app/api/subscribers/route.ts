import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/session";

/** The email list as a CSV file, for the researcher only. */
export async function GET() {
  const user = await currentUser();
  if (!isAdmin(user)) return new Response("Not found", { status: 404 });
  const rows = db.select().from(schema.subscribers).orderBy(desc(schema.subscribers.createdAt)).all();
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    "email,language,source,joined,unsubscribe_token",
    ...rows.map((r) => [r.email, r.locale, r.source, r.createdAt.toISOString(), r.token].map(cell).join(",")),
  ].join("\n");
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="subscribers.csv"', "cache-control": "no-store" },
  });
}
