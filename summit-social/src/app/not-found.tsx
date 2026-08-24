import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-950">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-600 mb-4">404</p>
        <h1 className="font-display text-7xl uppercase tracking-widest text-stone-100 sm:text-9xl">
          Off the map
        </h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-500">
          This page doesn&apos;t exist — or maybe it never did. Head back to base and try again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex border border-amber-500 bg-amber-500 px-8 py-3 font-display text-sm uppercase tracking-widest text-ink transition-colors hover:bg-amber-400"
        >
          Back to Basecamper
        </Link>
      </main>
      <Footer />
    </div>
  );
}
