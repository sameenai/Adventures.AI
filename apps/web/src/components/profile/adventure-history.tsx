import { AdventureGrid } from "@/components/adventures/adventure-grid";
import { ManageAdventureActions } from "@/components/profile/manage-adventure-actions";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { pluralise } from "@/lib/utils";
import type { AdventureWithUser } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface AdventureHistoryProps {
  adventures: AdventureWithUser[];
  currentUserId?: string;
  showManageActions?: boolean;
}

export function AdventureHistory({
  adventures,
  currentUserId,
  showManageActions = false,
}: AdventureHistoryProps) {
  if (!showManageActions) {
    return (
      <div>
        <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-stone-100">
          Adventures
        </h2>
        <AdventureGrid adventures={adventures} currentUserId={currentUserId} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-stone-100">
        Adventures
      </h2>
      {adventures.length === 0 ? (
        <div className="py-10 text-center border border-stone-800">
          <p className="font-display text-xs uppercase tracking-widest text-stone-500">
            No adventures yet
          </p>
          <Link
            href="/adventures/new"
            className="mt-4 inline-block border border-amber-500 bg-amber-500/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-amber-500 hover:bg-amber-500/20 transition-colors"
          >
            Share Your First Adventure
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adventures.map((adventure) => {
            const difficulty = DIFFICULTY_MAP.get(adventure.difficulty);
            return (
              <div
                key={adventure.id}
                className="border border-stone-800 bg-stone-900 overflow-hidden"
              >
                <Link href={`/adventures/${adventure.id}`}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={adventure.coverImageUrl}
                      alt={adventure.title}
                      fill
                      className="object-cover brightness-90"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-stone-950/80 px-2 py-0.5 font-display text-xs uppercase tracking-widest text-amber-500 backdrop-blur-sm">
                        {adventure.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    {!adventure.published && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-stone-950/80 px-2 py-0.5 font-mono text-xs text-stone-500 backdrop-blur-sm">
                          draft
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/adventures/${adventure.id}`}>
                    <h3 className="font-display text-base uppercase tracking-wider text-stone-100 hover:text-amber-400 transition-colors line-clamp-1">
                      {adventure.title}
                    </h3>
                  </Link>
                  <p className="mt-1 font-mono text-xs text-stone-500">{adventure.location}</p>
                  <div className="mt-2 flex items-center gap-3 font-mono text-xs">
                    <span className={difficulty?.color}>{difficulty?.label}</span>
                    <span className="text-stone-600">·</span>
                    <span className="text-stone-500">
                      {pluralise(adventure.durationDays, "day")}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className="text-stone-500">{adventure.voteCount} votes</span>
                  </div>
                  <ManageAdventureActions
                    adventureId={adventure.id}
                    published={adventure.published}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
