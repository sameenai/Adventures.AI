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
          className="rounded-full"
        />
      )}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        {user.bio && <p className="mt-2 max-w-lg text-sm text-gray-600">{user.bio}</p>}
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-500 sm:justify-start">
          <span>
            <strong className="text-gray-900">{user._count.adventures}</strong> adventures
          </span>
          <span>
            <strong className="text-gray-900">{user._count.votes}</strong> votes given
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
