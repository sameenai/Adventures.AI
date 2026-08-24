import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed | Basecamper",
  description: "Email preference updated.",
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const invalid = status === "invalid";

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500">Email</p>
      <h1 className="mt-1 font-display text-3xl uppercase tracking-widest text-stone-100">
        {invalid ? "Link expired" : "You're unsubscribed"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-stone-400">
        {invalid
          ? "This unsubscribe link is invalid or has expired. You can manage email preferences from your profile settings instead."
          : "You won't receive trip reminders any more. Booking confirmations still arrive — those are about your purchases, not marketing. Changed your mind? Turn reminders back on in your profile settings."}
      </p>
      <div className="mt-8">
        <Link
          href="/profile/edit"
          className="inline-block border border-stone-700 px-6 py-3 font-display text-xs uppercase tracking-widest text-stone-300 transition-colors hover:border-amber-500 hover:text-amber-500"
        >
          Email preferences
        </Link>
      </div>
    </div>
  );
}
