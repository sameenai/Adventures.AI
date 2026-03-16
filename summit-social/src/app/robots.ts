import { APP_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/adventures/", "/leaderboard", "/explore", "/feed", "/users/search"],
        disallow: ["/api/", "/itinerary", "/itineraries/", "/bookmarks", "/profile/edit"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
