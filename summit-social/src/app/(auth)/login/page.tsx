"use client";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to {APP_NAME}</p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/adventures" })}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/adventures" })}
          >
            Continue with GitHub
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-summit-600 hover:text-summit-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
