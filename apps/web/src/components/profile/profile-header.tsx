import type { UserProfile } from "@/types";
import Image from "next/image";
import { SocialLinks } from "./social-links";

interface ProfileHeaderProps {
  user: UserProfile;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      {user.avatarUrl && (
        <Image
          src={user.avatarUrl}
          alt={user.name ?? ""}
          width={96}
          height={96}
          className="border border-stone-700"
        />
      )}
      <div className="text-center sm:text-left">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl uppercase tracking-widest text-stone-100">
            {user.name}
          </h1>
          {user.plan === "PRO" && (
            <span className="border border-amber-500 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-500">
              Pro
            </span>
          )}
        </div>
        {user.bio && <p className="mt-2 max-w-lg text-sm text-stone-400">{user.bio}</p>}
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-stone-500 sm:justify-start">
          <span>
            <strong className="font-mono text-stone-100">{user._count.adventures}</strong>{" "}
            adventures
          </span>
          <span>
            <strong className="font-mono text-stone-100">{user._count.votes}</strong> votes given
          </span>
        </div>
        <SocialLinks
          instagramUrl={user.instagramUrl}
          twitterUrl={user.twitterUrl}
          websiteUrl={user.websiteUrl}
        />
      </div>
    </div>
  );
}
