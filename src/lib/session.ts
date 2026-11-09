import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { redirect } from "@/i18n/navigation";

export function adminEmail() {
  return (process.env.ADMIN_EMAIL ?? "teresa@origen.local").trim().toLowerCase();
}

export function isAdmin(user: Pick<User, "email"> | null | undefined) {
  return !!user && user.email.toLowerCase() === adminEmail();
}

export async function currentUser(): Promise<User | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.select().from(schema.users).where(eq(schema.users.id, id)).get() ?? null;
}

export async function requireUser(locale: string): Promise<User> {
  const user = await currentUser();
  if (!user) return redirect({ href: "/login", locale });
  return user;
}

export async function requireAdmin(locale: string): Promise<User> {
  const user = await requireUser(locale);
  if (!isAdmin(user)) return redirect({ href: "/dashboard", locale });
  return user;
}
