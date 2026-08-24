import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AccountDangerZone } from "./account-danger-zone";
import { OpenAiKeyForm } from "./openai-key-form";
import { ProfileEditForm } from "./profile-edit-form";
import { TravelerProfileForm } from "./traveler-profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Profile | Basecamper" };

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      bio: true,
      instagramUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      openAiApiKey: true,
      openAiApiKeyHint: true,
    },
  });

  if (!user) redirect("/login");

  const { openAiApiKey, openAiApiKeyHint, ...profileUser } = user;
  // The hint is precomputed at save time — never derived from the ciphertext.
  const keyHint = openAiApiKey ? (openAiApiKeyHint ?? "sk-…????") : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl uppercase tracking-widest text-stone-100">
          Edit Profile
        </h1>
        <p className="mt-1 font-mono text-xs text-stone-500">
          Update your name, bio, and social links.
        </p>
      </div>
      <ProfileEditForm user={profileUser} />
      <div id="api-key" className="mt-10">
        <OpenAiKeyForm initialHasKey={!!openAiApiKey} initialHint={keyHint} />
      </div>
      <TravelerProfileForm />
      <AccountDangerZone />
    </div>
  );
}
