import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { cn, pluralise } from "@/lib/utils";
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
  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty);

  return (
    <div className="group relative flex gap-4 border border-stone-800 bg-stone-950 p-3 transition-colors hover:border-amber-800/60 sm:gap-5 sm:p-4">
      {/* Left accent bar colored by difficulty */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 transition-opacity duration-300 group-hover:opacity-100 opacity-40",
          adventure.difficulty === "EASY" && "bg-emerald-500",
          adventure.difficulty === "MODERATE" && "bg-amber-400",
          adventure.difficulty === "CHALLENGING" && "bg-orange-400",
          adventure.difficulty === "EXTREME" && "bg-red-500",
          adventure.difficulty === "EXPEDITION_GRADE" && "bg-purple-500",
        )}
      />

      {/* Thumbnail */}
      <Link
        href={`/adventures/${adventure.id}`}
        className="relative h-16 w-24 shrink-0 overflow-hidden sm:h-20 sm:w-32"
      >
        <Image
          src={adventure.coverImageUrl}
          alt={adventure.title}
          fill
          className="object-cover brightness-75 transition-all duration-500 group-hover:brightness-90 group-hover:scale-105"
          sizes="128px"
        />
      </Link>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Top line: country */}
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">
          {adventure.country}
        </p>

        {/* Title */}
        <Link href={`/adventures/${adventure.id}`}>
          <h3 className="mt-0.5 font-display text-sm uppercase tracking-wider text-stone-100 transition-colors group-hover:text-amber-400 line-clamp-1 leading-snug">
            {adventure.title}
          </h3>
        </Link>

        {/* Location + tags row */}
        <p className="mt-0.5 font-mono text-[11px] text-stone-600 line-clamp-1">
          {adventure.location}
        </p>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-display text-[10px] uppercase tracking-widest text-amber-500/80">
            {adventure.category.replace(/_/g, " ")}
          </span>
          <span
            className={cn("font-display text-[10px] uppercase tracking-widest", difficulty?.color)}
          >
            {difficulty?.label ?? adventure.difficulty}
          </span>
          <span className="font-mono text-[10px] text-stone-600">
            {pluralise(adventure.durationDays, "day")}
          </span>
          {adventure._count?.comments !== undefined && adventure._count.comments > 0 && (
            <span className="font-mono text-[10px] text-stone-700">
              {pluralise(adventure._count.comments, "comment")}
            </span>
          )}
        </div>
      </div>

      {/* Right side: author + actions */}
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
