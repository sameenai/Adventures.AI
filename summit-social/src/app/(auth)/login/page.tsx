"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [devError, setDevError] = useState("");

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    setDevError("");
    const result = await signIn("credentials", {
      email,
      password: "dev",
      callbackUrl: "/adventures",
      redirect: false,
    });
    if (result?.error) {
      setDevError("Sign in failed. Check your email.");
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-950">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-end p-16 border-r border-stone-800"
        style={{
          backgroundImage: "radial-gradient(circle, #d97706 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundColor: "#0a0908",
          backgroundBlendMode: "normal",
        }}
      >
        <div style={{ backgroundImage: "none" }}>
          <span className="font-display text-4xl uppercase tracking-[0.2em] text-amber-500">
            {APP_NAME.replace("S", "S·")}
          </span>
          <p className="mt-3 text-sm leading-relaxed text-stone-500 max-w-xs">
            Plan extraordinary adventures. Join the community of serious explorers.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center">
            <span className="font-display text-2xl uppercase tracking-[0.2em] text-amber-500">
              {APP_NAME.replace("S", "S·")}
            </span>
          </div>

          <h1 className="font-display text-3xl uppercase tracking-widest text-stone-100">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to continue your expedition</p>

          <div className="mt-10 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => signIn("google", { callbackUrl: "/adventures" })}
            >
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => signIn("github", { callbackUrl: "/adventures" })}
            >
              Continue with GitHub
            </Button>
          </div>

          {/* Dev login — works without OAuth credentials */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-stone-950 px-3 font-mono text-xs text-stone-600">
                local dev
              </span>
            </div>
          </div>

          <form onSubmit={handleDevLogin} className="mt-6 space-y-3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <p className="font-mono text-xs text-stone-600">Password is always &ldquo;dev&rdquo;</p>
            {devError && <p className="font-mono text-xs text-red-400">{devError}</p>}
            <Button type="submit" className="w-full justify-center">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-600">
            No account?{" "}
            <Link href="/signup" className="text-amber-500 hover:text-amber-400 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
