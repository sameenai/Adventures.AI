import { Avatar } from "@/components/ui/avatar";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { cn, formatPrice, pluralise } from "@/lib/utils";
import type { AdventureWithUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { BookmarkButton } from "./bookmark-button";
import { VoteButton } from "./vote-button";

interface AdventureCardProps {
  adventure: AdventureWithUser;
  currentUserId?: string;
  hasVoted?: boolean;
  hasBookmarked?: boolean;
  featured?: boolean;
}

export function AdventureCard({
  adventure,
  currentUserId,
  hasVoted = false,
  hasBookmarked = false,
  featured = false,
}: AdventureCardProps) {
  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty);

  return (
    <div className="group relative overflow-hidden border border-stone-800 bg-stone-950 transition-colors duration-200 hover:border-stone-700">
      <Link href={`/adventures/${adventure.id}`}>
        <div
          className={cn("relative overflow-hidden", featured ? "aspect-[21/9]" : "aspect-[4/3]")}
        >
          <Image
            src={adventure.coverImageUrl}
            alt={adventure.title}
            fill
            className="object-cover brightness-90 transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

          {/* Difficulty badge */}
          {difficulty && (
            <div className="absolute left-3 top-3">
              <span
                className={cn(
                  "bg-stone-950/70 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] backdrop-blur-sm",
                  difficulty.color,
                )}
              >
                {difficulty.label}
              </span>
            </div>
          )}

          {/* Estimated cost */}
          {adventure.estimatedCost != null && adventure.estimatedCost > 0 && (
            <div className="absolute right-3 top-3">
              <span className="bg-stone-950/70 px-2 py-1 font-mono text-[10px] text-stone-300 backdrop-blur-sm">
                {`~${formatPrice(adventure.estimatedCost)} est.`}
              </span>
            </div>
          )}

          {/* Category label */}
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-300">
              {adventure.category.replace(/_/g, " ")}
            </span>
          </div>

          {/* Duration */}
          <div className="absolute bottom-3 right-3">
            <span className="font-mono text-[10px] text-stone-400">
              {pluralise(adventure.durationDays, "day")}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3">
        <Link href={`/adventures/${adventure.id}`}>
          <h3 className="font-display text-lg font-light leading-snug text-stone-100 transition-colors group-hover:text-amber-500 line-clamp-2">
            {adventure.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-stone-400 line-clamp-1">
          {adventure.location},{" "}
          <span className="font-medium text-stone-300">{adventure.country}</span>
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              src={adventure.user.avatarUrl}
              name={adventure.user.name}
              size={14}
              className="rounded-full opacity-60 shrink-0"
            />
            <span className="font-mono text-[10px] text-stone-600 truncate">
              {adventure.user.name}
            </span>
            {(adventure._count?.comments ?? 0) > 0 && (
              <>
                <span className="text-stone-700 text-[10px]">·</span>
                <span className="font-mono text-[10px] text-stone-700 shrink-0">
                  {pluralise(adventure._count?.comments ?? 0, "comment")}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <BookmarkButton
              adventureId={adventure.id}
              isBookmarked={hasBookmarked}
              disabled={!currentUserId}
            />
            <VoteButton
              adventureId={adventure.id}
              voteCount={adventure.voteCount}
              hasVoted={hasVoted}
              disabled={!currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
