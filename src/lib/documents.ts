import { eq } from "drizzle-orm";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { db, schema } from "@/db";
import type { SourceDocument } from "@/db/schema";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function uploadDir() {
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "data", "uploads");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Ids are UUIDs we generate, so the path cannot escape the upload folder. */
export function uploadPath(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Bad document id");
  return path.join(uploadDir(), `${id}.pdf`);
}

export function documentsByPerson(requestId: string) {
  const map = new Map<string, SourceDocument[]>();
  const rows = db.select().from(schema.documents).where(eq(schema.documents.requestId, requestId)).all();
  for (const d of rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    map.set(d.personId, [...(map.get(d.personId) ?? []), d]);
  }
  return map;
}

/** Where a reader opens the document: the outside link, or our access-checked file route. */
export function documentHref(d: SourceDocument, token?: string) {
  if (d.kind === "link") return d.url ?? "#";
  return `/api/documents/${d.id}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export function safeHttpUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** A tiny one-page PDF, used only for the demo data. */
export function samplePdf(lines: string[]) {
  const esc = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[^\x20-\x7e]/g, "")
      .replace(/[\\()]/g, "\\$&");
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 60 ${770 - i * 22} Td (${esc(l)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
