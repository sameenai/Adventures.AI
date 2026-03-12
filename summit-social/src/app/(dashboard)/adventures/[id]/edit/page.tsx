import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AdventureEditForm } from "./adventure-edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const adventure = await prisma.adventure.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!adventure) return {};
  return { title: `Edit ${adventure.title} | SummitSocial` };
}

export default async function EditAdventurePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const adventure = await prisma.adventure.findUnique({
    where: { id },
    include: { tags: { select: { name: true } } },
  });

  if (!adventure) notFound();
  if (adventure.userId !== session.user.id) redirect(`/adventures/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">Edit</p>
        <h1 className="font-display text-3xl uppercase tracking-widest text-stone-100">
          {adventure.title}
        </h1>
      </div>
      <AdventureEditForm adventure={adventure} />
    </div>
  );
}
