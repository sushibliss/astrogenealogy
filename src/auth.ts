import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // A fixed secret keeps local development zero-config; production must set AUTH_SECRET.
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV !== "production" ? "origen-local-development-secret" : undefined),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
        if (!user) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
