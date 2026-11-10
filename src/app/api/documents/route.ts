import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { db, schema } from "@/db";
import { requestForUser } from "@/lib/access";
import { MAX_UPLOAD_BYTES, safeHttpUrl, uploadPath } from "@/lib/documents";
import { currentUser, isAdmin } from "@/lib/session";

/** Researcher-only: attach a PDF or a link to a person. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const requestId = String(form.get("requestId") ?? "");
  const personId = String(form.get("personId") ?? "");
  const title = String(form.get("title") ?? "").trim().slice(0, 160);
  const access = requestForUser(requestId, user);
  if (!access || !access.people.some((p) => p.id === personId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!title) return NextResponse.json({ error: "title" }, { status: 400 });

  const id = randomUUID();
  const file = form.get("file");
  const link = String(form.get("url") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "size" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    // Trust the content, not the declared type: a PDF starts with "%PDF-".
    if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") return NextResponse.json({ error: "type" }, { status: 400 });
    writeFileSync(uploadPath(id), bytes);
    db.insert(schema.documents)
      .values({ id, requestId, personId, title, kind: "file", fileName: file.name.slice(0, 200), size: bytes.length, createdAt: new Date() })
      .run();
  } else if (link) {
    const url = safeHttpUrl(link);
    if (!url) return NextResponse.json({ error: "url" }, { status: 400 });
    db.insert(schema.documents).values({ id, requestId, personId, title, kind: "link", url, createdAt: new Date() }).run();
  } else {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id });
}
