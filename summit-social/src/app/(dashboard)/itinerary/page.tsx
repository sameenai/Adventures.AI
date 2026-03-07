import { ChatWindow } from "@/components/chat/chat-window";
import { authOptions } from "@/lib/auth/config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Plan Trip | SummitSocial" };

export default async function ItineraryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">AI Trip Planner</h1>
      <p className="mt-2 text-sm text-gray-600">
        Describe your dream adventure and I&apos;ll create a detailed itinerary for you.
      </p>
      <div className="mt-6 h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white">
        <ChatWindow />
      </div>
    </div>
  );
}
