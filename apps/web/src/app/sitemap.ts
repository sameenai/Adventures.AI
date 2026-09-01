import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const adventures = await prisma.adventure.findMany({
    where: { published: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${APP_URL}/adventures`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/flights`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/itinerary`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const adventureRoutes: MetadataRoute.Sitemap = adventures.map((a) => ({
    url: `${APP_URL}/adventures/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...adventureRoutes];
}
