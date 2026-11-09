import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { isAdmin } from "./session";
import { sortPeople } from "./people";

export function loadRequestBundle(requestId: string) {
  const request = db.select().from(schema.requests).where(eq(schema.requests.id, requestId)).get();
  if (!request) return null;
  const people = sortPeople(db.select().from(schema.people).where(eq(schema.people.requestId, requestId)).all());
  const publication =
    db.select().from(schema.publications).where(eq(schema.publications.requestId, requestId)).get() ?? null;
  return { request, people, publication };
}

/** Owner or admin access to a request; null when the user may not see it. */
export function requestForUser(requestId: string, user: User) {
  const bundle = loadRequestBundle(requestId);
  if (!bundle) return null;
  const owner = bundle.request.ownerId === user.id;
  const admin = isAdmin(user);
  if (!owner && !admin) return null;
  return { ...bundle, viewer: owner ? ("owner" as const) : ("admin" as const), isAdmin: admin, isOwner: owner };
}

/** Read-only guest access through an invite token. Only published work is visible. */
export function requestForToken(token: string) {
  const invite = db
    .select()
    .from(schema.invites)
    .where(and(eq(schema.invites.token, token), isNull(schema.invites.revokedAt)))
    .get();
  if (!invite) return null;
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return null;
  const bundle = loadRequestBundle(invite.requestId);
  if (!bundle) return null;
  if (bundle.request.status !== "published" || !bundle.publication?.publishedAt) return null;
  return { ...bundle, invite };
}
