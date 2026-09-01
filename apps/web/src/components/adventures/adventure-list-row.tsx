import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { cn, formatPrice, pluralise } from "@/lib/utils";
import type { AdventureWithUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { BookmarkButton } from "./bookmark-button";
import { VoteButton } from "./vote-button";

interface AdventureListRowProps {
  adventure: AdventureWithUser;
  currentUserId?: string;
  hasVoted?: boolean;
  hasBookmarked?: boolean;
}

export function AdventureListRow({
  adventure,
  currentUserId,
  hasVoted = false,
  hasBookmarked = false,
}: AdventureListRowProps) {
  return (
    <div
      className={cn(
        "group flex gap-4 border-b border-stone-800 py-5 transition-colors hover:bg-stone-900/40",
      )}
    >
      {/* Thumbnail */}
      <Link
        href={`/adventures/${adventure.id}`}
        className="relative h-16 w-24 shrink-0 overflow-hidden sm:h-20 sm:w-32"
      >
        <Image
          src={adventure.coverImageUrl}
          alt={adventure.title}
          fill
          className="object-cover brightness-90 transition-transform duration-500 group-hover:scale-105"
          sizes="128px"
        />
      </Link>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <Link href={`/adventures/${adventure.id}`}>
          <h3 className="font-display text-base font-light text-stone-100 transition-colors group-hover:text-amber-500 line-clamp-1">
            {adventure.title}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-stone-400 line-clamp-1">
          {adventure.location},{" "}
          <span className="font-medium text-stone-300">{adventure.country}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-stone-500">
            {adventure.category.replace(/_/g, " ")}
          </span>
          {(() => {
            const diff = DIFFICULTY_MAP.get(adventure.difficulty);
            return (
              <span className={cn("text-[10px]", diff?.color ?? "text-stone-600")}>
                {diff?.label ?? adventure.difficulty}
              </span>
            );
          })()}
          <span className="font-mono text-[10px] text-stone-600">
            {pluralise(adventure.durationDays, "day")}
          </span>
          {adventure.estimatedCost != null && adventure.estimatedCost > 0 && (
            <span className="font-mono text-[10px] text-stone-600">
              {`~${formatPrice(adventure.estimatedCost)} est.`}
            </span>
          )}
          {(adventure._count?.comments ?? 0) > 0 && (
            <span className="font-mono text-[10px] text-stone-700">
              {pluralise(adventure._count?.comments ?? 0, "comment")}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1">
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
        <div className="flex items-center gap-1.5">
          {adventure.user.avatarUrl && (
            <Image
              src={adventure.user.avatarUrl}
              alt={adventure.user.name ?? ""}
              width={14}
              height={14}
              className="rounded-full opacity-50 shrink-0"
            />
          )}
          <span className="font-mono text-[10px] text-stone-600 max-w-[80px] truncate">
            {adventure.user.name}
          </span>
        </div>
      </div>
    </div>
  );
}
