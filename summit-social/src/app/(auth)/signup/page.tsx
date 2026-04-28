"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");

  async function handleDevSignup(e: React.FormEvent) {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password: "dev",
      callbackUrl: "/adventures",
    });
  }

  return (
    <div className="flex min-h-screen bg-stone-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-end p-16 border-r-2 border-stone-800 relative overflow-hidden bg-stone-900">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, var(--bc-amber-600) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: "var(--dot-opacity)",
          }}
        />
        <div className="relative z-10">
          <span className="font-display text-5xl uppercase tracking-[0.2em] text-amber-500">
            {APP_NAME}
          </span>
          <div className="mt-3 h-0.5 w-12 bg-amber-500" />
          <p
            className="mt-4 text-sm leading-relaxed text-stone-400 max-w-xs"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Plan extraordinary adventures. Join the community of serious explorers.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center">
            <span className="font-display text-2xl uppercase tracking-[0.2em] text-amber-500">
              {APP_NAME}
            </span>
          </div>

          <h1 className="font-display text-3xl uppercase tracking-widest text-stone-100">
            Start exploring
          </h1>
          <p className="mt-2 text-sm text-stone-400" style={{ fontFamily: "var(--font-sans)" }}>
            Create your account — it&apos;s free
          </p>

          <div className="mt-10">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => signIn("google", { callbackUrl: "/adventures" })}
            >
              Sign up with Google
            </Button>
          </div>

          {/* Dev signup */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-stone-950 px-3 font-mono text-xs text-stone-500">local dev</span>
            </div>
          </div>

          <form onSubmit={handleDevSignup} className="mt-6 space-y-3">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <p className="font-mono text-xs text-stone-500">
              Creates account instantly — no password needed
            </p>
            <Button type="submit" className="w-full justify-center">
              Create account
            </Button>
          </form>

          <p
            className="mt-6 text-center text-xs text-stone-500"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-amber-500 hover:text-amber-400 transition-colors font-semibold"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
