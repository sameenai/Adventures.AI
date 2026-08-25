import { track } from "@/lib/analytics/track";
import { TERMS_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// The dev login mints a session for ANY email, so it must never be reachable
// in a deployed environment. NODE_ENV alone is a fragile boundary (one env
// var away from account takeover on a staging revision), so it also requires
// an explicit opt-in that no deploy config ever sets.
const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_LOGIN === "true";

const devProvider = devLoginEnabled
  ? [
      // Local dev login — works without any OAuth credentials.
      // Sign in with any email + password "dev". NOT included in production builds.
      CredentialsProvider({
        id: "credentials",
        name: "Dev Login",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || credentials.password !== "dev") return null;
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {},
            create: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(credentials.email)}`,
            },
          });
          return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl };
        },
      }),
    ]
  : [];

export const authOptions: NextAuthOptions = {
  // No database adapter: session.strategy is "jwt", which is fully self-contained.
  // PrismaAdapter + CredentialsProvider + jwt strategy is unsupported in NextAuth v4
  // and causes CLIENT_FETCH_ERROR on every session fetch.
  providers: [
    ...devProvider,
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
    // JWT sessions cannot be revoked server-side, so keep the exposure window
    // of a stolen cookie short (NextAuth default is 30 days).
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    // OAuth providers hand us THEIR profile id, not a database row. Without
    // an adapter, every session must be re-keyed to the upserted User row or
    // all prisma lookups keyed on session.user.id silently miss.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            avatarUrl: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
          },
        });
        user.id = dbUser.id;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    // Click-wrap record: /login and /signup state that continuing accepts the
    // Terms & Privacy Policy; the first sign-in stamps which version.
    async signIn({ user }) {
      if (!user?.email) return;
      const stamped = await prisma.user
        .updateMany({
          where: { email: user.email, termsAcceptedAt: null },
          data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
        })
        .catch(() => ({ count: 0 }));
      // First terms stamp == first sign-in == the signup funnel moment.
      if (stamped.count > 0 && user.id) track("signup", { userId: user.id });
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
