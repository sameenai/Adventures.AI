import { APP_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /itinerary (signed-out planner state) and /flights are public;
        // /feed and /itinerary/[id] redirect unauthenticated visitors, so
        // they are disallowed. "/itinerary/" (trailing slash) blocks the
        // per-itinerary pages without blocking the planner itself.
        allow: [
          "/",
          "/adventures/",
          "/leaderboard",
          "/explore",
          "/itinerary",
          "/flights",
          "/users/search",
        ],
        disallow: ["/api/", "/itinerary/", "/itineraries/", "/bookmarks", "/feed", "/profile/edit"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
