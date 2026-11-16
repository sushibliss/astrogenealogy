import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Editorial pages and guides live as Markdown files under /content, one folder
 * per language, so they can be edited without touching code.
 *
 *   ---
 *   key: no-birth-time        (links a guide to its translation)
 *   title: …
 *   description: …            (shown in Google and when shared)
 *   date: 2026-11-16
 *   ---
 */
export type Doc = { slug: string; key: string; title: string; description: string; date: string; body: string };

const root = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), "content");
const cache = new Map<string, Doc[]>();

function parse(file: string, slug: string): Doc {
  const raw = readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  const meta: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    slug,
    key: meta.key ?? slug,
    title: meta.title ?? slug,
    description: meta.description ?? "",
    date: meta.date ?? "",
    body: (m?.[2] ?? raw).trim(),
  };
}

function load(kind: "pages" | "guides", locale: string): Doc[] {
  const lang = locale === "es" ? "es" : "en";
  const id = `${kind}/${lang}`;
  const cached = cache.get(id);
  if (cached && process.env.NODE_ENV === "production") return cached;
  const dir = path.join(root(), kind, lang);
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {}
  const docs = files
    .map((f) => parse(path.join(dir, f), f.replace(/\.md$/, "")))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  cache.set(id, docs);
  return docs;
}

export const guides = (locale: string) => load("guides", locale);
export const guide = (locale: string, slug: string) => guides(locale).find((g) => g.slug === slug) ?? null;
/** the same guide in another language, if it has been translated */
export const guideByKey = (locale: string, key: string) => guides(locale).find((g) => g.key === key) ?? null;
export const page = (locale: string, slug: string) => load("pages", locale).find((p) => p.slug === slug) ?? null;

/** Splits a page written as "## Question" + answer into pairs (the FAQ). */
export function questions(body: string) {
  return body
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [q, ...rest] = block.split("\n");
      return { question: q.trim(), answer: rest.join("\n").trim() };
    });
}
