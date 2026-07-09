import type { Adventure, Comment, Itinerary, ItineraryDay, Tag, User, Vote } from "@prisma/client";

export type AdventureWithUser = Adventure & {
  user: Pick<User, "id" | "name" | "avatarUrl">;
  tags: Tag[];
  _count?: { comments: number };
};

export type AdventureDetail = Adventure & {
  user: Pick<User, "id" | "name" | "avatarUrl" | "bio" | "instagramUrl">;
  tags: Tag[];
  comments: CommentWithUser[];
  votes: Pick<Vote, "userId">[];
};

export type CommentWithUser = Comment & {
  user: Pick<User, "id" | "name" | "avatarUrl">;
  replies?: CommentWithUser[];
  _count?: { reactions: number };
  viewerReacted?: boolean;
};

export type ItineraryWithDays = Itinerary & {
  days: ItineraryDay[];
};

export type UserProfile = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "avatarUrl"
  | "bio"
  | "instagramUrl"
  | "twitterUrl"
  | "websiteUrl"
  | "plan"
> & {
  adventures: AdventureWithUser[];
  _count: { adventures: number; votes: number };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  toolCalls?: ToolCallResult[];
  isError?: boolean;
};

export type ToolCallResult = {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type LeaderboardEntry = {
  rank: number;
  adventure: AdventureWithUser;
  trend: "up" | "down" | "stable" | "new";
  previousRank?: number;
};

export type TimeWindow = "all" | "year" | "month" | "week";

export type ApiError = {
  error: string;
  code: string;
  details?: unknown;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
