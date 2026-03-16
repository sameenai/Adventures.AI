import { withAuth } from "next-auth/middleware";

/**
 * Edge middleware that protects authenticated routes.
 * Unauthenticated visitors are redirected to /login.
 *
 * Public routes (not matched here) need no authentication:
 *   /  /adventures  /adventures/[id]  /leaderboard  /feed
 *   /explore  /users/search  /profile/[id]  /login  /signup
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/itinerary",
    "/itineraries/:path*",
    "/bookmarks",
    "/flights",
    "/adventures/new",
    "/adventures/:id/edit",
    "/profile/edit",
  ],
};
