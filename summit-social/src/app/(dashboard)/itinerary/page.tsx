import { ChatWindow } from "@/components/chat/chat-window";
import { authOptions } from "@/lib/auth/config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Plan Trip | SummitSocial" };

export default async function ItineraryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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
      <div className="mt-6 h-[600px] overflow-hidden border border-stone-800">
        <ChatWindow />
      </div>
    </div>
  );
}
