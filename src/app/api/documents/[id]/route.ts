import { eq } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { db, schema } from "@/db";
import { requestForToken, requestForUser } from "@/lib/access";
import { uploadPath } from "@/lib/documents";
import { isPrivateForGuests } from "@/lib/people";
import { currentUser } from "@/lib/session";

const notFound = () => new Response("Not found", { status: 404 });

/**
 * Serves an uploaded PDF to someone allowed to see the person it belongs to:
 * the request's owner, the researcher, or a guest holding a valid invite token
 * (never for living relatives).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return notFound();
  const doc = db.select().from(schema.documents).where(eq(schema.documents.id, id)).get();
  if (!doc || doc.kind !== "file") return notFound();

  const token = new URL(request.url).searchParams.get("token");
  let allowed = false;
  if (token) {
    const access = requestForToken(token);
    const person = access?.people.find((p) => p.id === doc.personId);
    allowed = !!access && access.request.id === doc.requestId && !!person && !isPrivateForGuests(person);
  } else {
    const user = await currentUser();
    allowed = !!user && !!requestForUser(doc.requestId, user);
  }
  if (!allowed) return notFound();

  const file = uploadPath(doc.id);
  if (!existsSync(file)) return notFound();
  const name = (doc.fileName || "document.pdf").replace(/[^\w.\- ]/g, "_");
  return new Response(new Uint8Array(readFileSync(file)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
