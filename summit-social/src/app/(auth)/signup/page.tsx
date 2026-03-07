"use client";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen bg-stone-950">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-end p-16 border-r border-stone-800"
        style={{
          backgroundImage: "radial-gradient(circle, #d97706 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundColor: "#0a0908",
        }}
      >
        <div>
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
            Start exploring
          </h1>
          <p className="mt-2 text-sm text-stone-500">Create your account — it&apos;s free</p>

          <div className="mt-10 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => signIn("google", { callbackUrl: "/adventures" })}
            >
              Sign up with Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => signIn("github", { callbackUrl: "/adventures" })}
            >
              Sign up with GitHub
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-stone-600">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-500 hover:text-amber-400 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
