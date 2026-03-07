import { Card } from "@/components/ui/card";
import { DIFFICULTIES } from "@/lib/constants";
import { cn, pluralise } from "@/lib/utils";
import type { AdventureWithUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { VoteButton } from "./vote-button";

interface AdventureCardProps {
  adventure: AdventureWithUser;
  currentUserId?: string;
  hasVoted?: boolean;
}

export function AdventureCard({ adventure, currentUserId, hasVoted = false }: AdventureCardProps) {
  const difficulty = DIFFICULTIES.find((d) => d.value === adventure.difficulty);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/adventures/${adventure.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={adventure.coverImageUrl}
            alt={adventure.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 backdrop-blur-sm">
              {adventure.category.replace("_", " ")}
            </span>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/adventures/${adventure.id}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-summit-600">
            {adventure.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500">{adventure.location}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className={cn("font-medium", difficulty?.color)}>{difficulty?.label}</span>
            <span>{pluralise(adventure.durationDays, "day")}</span>
          </div>
          <VoteButton
            adventureId={adventure.id}
            voteCount={adventure.voteCount}
            hasVoted={hasVoted}
            disabled={!currentUserId}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          {adventure.user.avatarUrl && (
            <Image
              src={adventure.user.avatarUrl}
              alt={adventure.user.name ?? ""}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span className="text-xs text-gray-500">{adventure.user.name}</span>
        </div>
      </div>
    </Card>
  );
}
