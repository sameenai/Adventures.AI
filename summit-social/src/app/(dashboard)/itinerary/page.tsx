import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { getServerSession } from "next-auth";
import Link from "next/link";

export const metadata = { title: "Plan Trip | Basecamp" };

export default async function ItineraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const { prompt } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          AI-Powered
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Trip Planner
        </h1>
      </div>

      {session ? (
        <div className="mt-6 h-[600px] overflow-hidden border border-stone-800">
          <ChatWindow initialPrompt={prompt} />
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-stone-700">
            <svg
              className="h-7 w-7 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-stone-100">
              Sign in to start planning
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
              The AI Trip Planner builds personalised day-by-day itineraries around your pace,
              budget, and ambitions. Create a free account to get started.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/signup">
              <Button>Create free account</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
