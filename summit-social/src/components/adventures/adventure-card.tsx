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
    <div className="group border border-stone-800 bg-stone-900 overflow-hidden transition-colors hover:border-stone-700">
      <Link href={`/adventures/${adventure.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={adventure.coverImageUrl}
            alt={adventure.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 brightness-90"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2">
            <span className="bg-stone-950/80 px-2 py-0.5 font-display text-xs uppercase tracking-widest text-amber-500 backdrop-blur-sm">
              {adventure.category.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/adventures/${adventure.id}`}>
          <h3 className="font-display text-base uppercase tracking-wider text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-1">
            {adventure.title}
          </h3>
        </Link>
        <p className="mt-1 font-mono text-xs text-stone-500">{adventure.location}</p>
        <div className="mt-4 flex items-center justify-between border-t border-stone-800 pt-3">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className={cn("font-medium", difficulty?.color)}>{difficulty?.label}</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-500">{pluralise(adventure.durationDays, "day")}</span>
            {adventure._count?.comments !== undefined && adventure._count.comments > 0 && (
              <>
                <span className="text-stone-600">·</span>
                <span className="text-stone-500">
                  {pluralise(adventure._count.comments, "comment")}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
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
        <div className="mt-3 flex items-center gap-2">
          {adventure.user.avatarUrl && (
            <Image
              src={adventure.user.avatarUrl}
              alt={adventure.user.name ?? ""}
              width={18}
              height={18}
              className="rounded-full opacity-80"
            />
          )}
          <span className="font-mono text-xs text-stone-600">{adventure.user.name}</span>
        </div>
      </div>
    </div>
  );
}
