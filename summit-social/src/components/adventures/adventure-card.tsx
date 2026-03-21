import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { cn, pluralise } from "@/lib/utils";
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
}

export function AdventureCard({
  adventure,
  currentUserId,
  hasVoted = false,
  hasBookmarked = false,
}: AdventureCardProps) {
  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty);

  return (
    <div className="group relative border border-stone-800 bg-stone-950 overflow-hidden transition-colors duration-300 hover:border-amber-800/60">
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

      <Link href={`/adventures/${adventure.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={adventure.coverImageUrl}
            alt={adventure.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay — heavier at bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

          {/* Top-right: difficulty badge */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={cn(
                "px-2 py-0.5 font-display text-[10px] uppercase tracking-widest backdrop-blur-sm",
                difficulty?.color,
                "bg-stone-950/70",
              )}
            >
              {difficulty?.label}
            </span>
          </div>

          {/* Bottom-left: category + demo */}
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-widest text-amber-500/90">
              {adventure.category.replace(/_/g, " ")}
            </span>
            {adventure.id.startsWith("seed-") && (
              <>
                <span className="text-stone-600 text-[10px]">·</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-stone-600">
                  Demo
                </span>
              </>
            )}
          </div>

          {/* Bottom-right: duration pill */}
          <div className="absolute bottom-2.5 right-3">
            <span className="font-mono text-[10px] text-stone-400">
              {pluralise(adventure.durationDays, "day")}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-4 pt-3 pb-4">
        <Link href={`/adventures/${adventure.id}`}>
          <h3 className="font-display text-sm uppercase tracking-wider text-stone-100 transition-colors group-hover:text-amber-400 line-clamp-1 leading-snug">
            {adventure.title}
          </h3>
        </Link>
        <p className="mt-0.5 font-mono text-[11px] text-stone-600 line-clamp-1">
          {adventure.location}
        </p>

        <div className="mt-3 flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-1.5 min-w-0">
            {adventure.user.avatarUrl && (
              <Image
                src={adventure.user.avatarUrl}
                alt={adventure.user.name ?? ""}
                width={16}
                height={16}
                className="rounded-full opacity-60 shrink-0"
              />
            )}
            <span className="font-mono text-[11px] text-stone-600 truncate">
              {adventure.user.name}
            </span>
            {adventure._count?.comments !== undefined && adventure._count.comments > 0 && (
              <>
                <span className="text-stone-800 text-[11px] shrink-0">·</span>
                <span className="font-mono text-[11px] text-stone-700 shrink-0">
                  {pluralise(adventure._count.comments, "comment")}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
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
