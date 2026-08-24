import { withAuth } from "next-auth/middleware";

/**
 * Edge middleware that protects authenticated routes.
 * Unauthenticated visitors are redirected to /login.
 *
 * Public routes (not matched here) need no authentication:
 *   /  /adventures  /adventures/[id]  /leaderboard  /explore
 *   /itinerary  /flights  /users/search  /profile/[id]  /login  /signup
 *
 * /itinerary renders its own signed-out state and /flights is browsable
 * without an account, so neither is gated here. /feed and /itinerary/[id]
 * redirect unauthenticated visitors at the page level.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/itineraries/:path*",
    "/bookmarks",
    "/adventures/new",
    "/adventures/:id/edit",
    "/profile/edit",
  ],
};
