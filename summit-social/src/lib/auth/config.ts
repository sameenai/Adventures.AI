import { prisma } from "@/lib/db/prisma";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // No database adapter: session.strategy is "jwt", which is fully self-contained.
  // PrismaAdapter + CredentialsProvider + jwt strategy is unsupported in NextAuth v4
  // and causes CLIENT_FETCH_ERROR on every session fetch.
  providers: [
    // Local dev login — works without any OAuth credentials.
    // Sign in with any email + password "dev".
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
