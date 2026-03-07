import { describe, expect, it } from "vitest";
import { createAdventureSchema, adventureFilterSchema } from "@/lib/validators/adventure";
import { flightSearchSchema } from "@/lib/validators/flight";
import { chatMessageSchema } from "@/lib/validators/chat";
import { createCommentSchema } from "@/lib/validators/comment";
import { updateProfileSchema } from "@/lib/validators/user";

describe("createAdventureSchema", () => {
  it("validates a correct adventure input", () => {
    const input = {
      title: "Test Trek",
      description: "A wonderful test trek through the mountains.",
      location: "Alps, Switzerland",
      country: "Switzerland",
      continent: "Europe",
      category: "TREKKING",
      difficulty: "MODERATE",
      durationDays: 5,
      coverImageUrl: "https://example.com/cover.jpg",
    };
    const result = createAdventureSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const input = {
      title: "Test",
      description: "Test description long enough.",
      location: "Test",
      country: "UK",
      continent: "Europe",
      category: "INVALID",
      difficulty: "EASY",
      durationDays: 1,
      coverImageUrl: "https://example.com/img.jpg",
    };
    const result = createAdventureSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects title shorter than 3 characters", () => {
    const input = {
      title: "Hi",
      description: "Long enough description here.",
      location: "Test",
      country: "UK",
      continent: "Europe",
      category: "TREKKING",
      difficulty: "EASY",
      durationDays: 1,
      coverImageUrl: "https://example.com/img.jpg",
    };
    const result = createAdventureSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("flightSearchSchema", () => {
  it("validates a correct flight search", () => {
    const result = flightSearchSchema.safeParse({
      origin: "LHR",
      destination: "JFK",
      departureDate: "2025-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid IATA code", () => {
    const result = flightSearchSchema.safeParse({
      origin: "LHRR",
      destination: "JFK",
      departureDate: "2025-06-15",
    });
    expect(result.success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  it("validates a simple message", () => {
    const result = chatMessageSchema.safeParse({ message: "Plan a trip to Nepal" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = chatMessageSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });
});

describe("createCommentSchema", () => {
  it("validates a comment", () => {
    const result = createCommentSchema.safeParse({ body: "Great adventure!" });
    expect(result.success).toBe(true);
  });
});

describe("updateProfileSchema", () => {
  it("validates partial profile update", () => {
    const result = updateProfileSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });
});

describe("adventureFilterSchema", () => {
  it("validates default filters", () => {
    const result = adventureFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("votes");
    }
  });
});
