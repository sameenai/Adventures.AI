// Scheduled-job endpoint: secret-gated, audited via JobRun
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    jobRun: { create: vi.fn(), update: vi.fn() },
    adventureView: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    itinerary: { findMany: vi.fn(), deleteMany: vi.fn() },
    analyticsEvent: { deleteMany: vi.fn() },
    emailLog: { deleteMany: vi.fn() },
    searchEvent: { deleteMany: vi.fn() },
    messageFeedback: { deleteMany: vi.fn() },
  },
}));

import { POST } from "@/app/api/jobs/[job]/route";
import { prisma } from "@/lib/db/prisma";
import {
  ANALYTICS_EVENT_RETENTION_DAYS,
  EMAIL_LOG_RETENTION_DAYS,
  FEEDBACK_DOWN_RETENTION_DAYS,
  FEEDBACK_UP_RETENTION_DAYS,
  SEARCH_EVENT_RETENTION_DAYS,
  runRetention,
} from "@/lib/jobs/retention";

const mockJobRun = prisma.jobRun as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockViews = prisma.adventureView as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockNotifications = prisma.notification as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;
const mockItinerary = prisma.itinerary as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockAnalytics = prisma.analyticsEvent as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockEmailLog = prisma.emailLog as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockSearchEvents = prisma.searchEvent as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockFeedback = prisma.messageFeedback as unknown as Record<string, ReturnType<typeof vi.fn>>;

const DAY_MS = 24 * 60 * 60 * 1000;

function mockNewTrims(count = 0) {
  mockAnalytics.deleteMany.mockResolvedValue({ count });
  mockEmailLog.deleteMany.mockResolvedValue({ count });
  mockSearchEvents.deleteMany.mockResolvedValue({ count });
  mockFeedback.deleteMany.mockResolvedValue({ count });
}

const jobRequest = (job: string, secret?: string) =>
  POST(
    new NextRequest(`http://localhost/api/jobs/${job}`, {
      method: "POST",
      headers: secret ? { "x-jobs-secret": secret } : {},
    }),
    { params: Promise.resolve({ job }) },
  );

describe("POST /api/jobs/[job]", () => {
  beforeEach(() => {
    vi.stubEnv("JOBS_SECRET", "test-jobs-secret-123");
    mockJobRun.create.mockResolvedValue({ id: "run-1" });
    mockJobRun.update.mockResolvedValue({});
    mockViews.deleteMany.mockResolvedValue({ count: 3 });
    mockNotifications.deleteMany.mockResolvedValue({ count: 2 });
    mockItinerary.findMany.mockResolvedValue([]);
    mockItinerary.deleteMany.mockResolvedValue({ count: 0 });
    mockNewTrims(5);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 503 when JOBS_SECRET is not configured", async () => {
    vi.stubEnv("JOBS_SECRET", "");
    const res = await jobRequest("retention", "anything");
    expect(res.status).toBe(503);
  });

  it("returns 401 with a wrong secret", async () => {
    const res = await jobRequest("retention", "wrong");
    expect(res.status).toBe(401);
    expect(mockJobRun.create).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown jobs", async () => {
    const res = await jobRequest("mine-bitcoin", "test-jobs-secret-123");
    expect(res.status).toBe(404);
  });

  it("runs retention and records a SUCCEEDED JobRun with stats", async () => {
    const res = await jobRequest("retention", "test-jobs-secret-123");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("SUCCEEDED");
    expect(data.stats.adventureViewsDeleted).toBe(3);
    expect(data.stats.readNotificationsDeleted).toBe(2);
    expect(data.stats.analyticsEventsDeleted).toBe(5);
    expect(data.stats.emailLogsDeleted).toBe(5);
    expect(data.stats.searchEventsDeleted).toBe(5);
    expect(data.stats.feedbackUpDeleted).toBe(5);
    expect(data.stats.feedbackDownDeleted).toBe(5);

    expect(mockJobRun.create).toHaveBeenCalledWith({
      data: { jobName: "retention", status: "RUNNING" },
    });
    expect(mockJobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-1" },
        data: expect.objectContaining({ status: "SUCCEEDED" }),
      }),
    );
  });

  it("records a FAILED JobRun and returns 500 when the job throws", async () => {
    mockViews.deleteMany.mockRejectedValue(new Error("db exploded"));
    const res = await jobRequest("retention", "test-jobs-secret-123");
    expect(res.status).toBe(500);
    expect(mockJobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });
});

describe("retention job semantics", () => {
  beforeEach(() => {
    vi.stubEnv("JOBS_SECRET", "test-jobs-secret-123");
    mockJobRun.create.mockResolvedValue({ id: "run-1" });
    mockJobRun.update.mockResolvedValue({});
    mockViews.deleteMany.mockResolvedValue({ count: 0 });
    mockNotifications.deleteMany.mockResolvedValue({ count: 0 });
    mockItinerary.deleteMany.mockResolvedValue({ count: 1 });
    mockNewTrims();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("only prunes read notifications and only abandoned itineraries", async () => {
    mockItinerary.findMany.mockResolvedValue([
      { id: "empty-1", chatHistory: [] },
      { id: "opening-only", chatHistory: [{ role: "user" }, { role: "assistant" }] },
      { id: "real-trip", chatHistory: [{}, {}, {}, {}] },
    ]);

    await jobRequest("retention", "test-jobs-secret-123");

    expect(mockNotifications.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ read: true }) }),
    );
    // itineraries with real conversations survive
    expect(mockItinerary.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["empty-1", "opening-only"] } },
    });
    // and the candidate query itself excludes anything with days or bookings
    expect(mockItinerary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          days: { none: {} },
          flightBookings: { none: {} },
        }),
      }),
    );
  });
});

describe("retention windows — analytics, email log, search, feedback", () => {
  const now = new Date("2026-08-25T12:00:00Z");
  const cutoff = (days: number) => new Date(now.getTime() - days * DAY_MS);

  beforeEach(() => {
    mockViews.deleteMany.mockResolvedValue({ count: 0 });
    mockNotifications.deleteMany.mockResolvedValue({ count: 0 });
    mockItinerary.findMany.mockResolvedValue([]);
    mockItinerary.deleteMany.mockResolvedValue({ count: 0 });
    mockNewTrims();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("trims analytics events older than 180 days", async () => {
    mockAnalytics.deleteMany.mockResolvedValue({ count: 7 });
    const stats = await runRetention(now);
    expect(mockAnalytics.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: cutoff(ANALYTICS_EVENT_RETENTION_DAYS) } },
    });
    expect(mockAnalytics.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: cutoff(180) } },
    });
    expect(stats.analyticsEventsDeleted).toBe(7);
  });

  it("trims email log entries older than 365 days", async () => {
    mockEmailLog.deleteMany.mockResolvedValue({ count: 4 });
    const stats = await runRetention(now);
    expect(mockEmailLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: cutoff(EMAIL_LOG_RETENTION_DAYS) } },
    });
    expect(mockEmailLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: cutoff(365) } },
    });
    expect(stats.emailLogsDeleted).toBe(4);
  });

  it("trims search events older than 365 days", async () => {
    mockSearchEvents.deleteMany.mockResolvedValue({ count: 2 });
    const stats = await runRetention(now);
    expect(mockSearchEvents.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: cutoff(SEARCH_EVENT_RETENTION_DAYS) } },
    });
    expect(mockSearchEvents.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: cutoff(365) } },
    });
    expect(stats.searchEventsDeleted).toBe(2);
  });

  it("keeps DOWN feedback longer than UP — 365 vs 90 days, split by rating", async () => {
    mockFeedback.deleteMany
      .mockResolvedValueOnce({ count: 9 }) // UP pass
      .mockResolvedValueOnce({ count: 1 }); // DOWN pass
    const stats = await runRetention(now);

    expect(FEEDBACK_DOWN_RETENTION_DAYS).toBeGreaterThan(FEEDBACK_UP_RETENTION_DAYS);
    expect(mockFeedback.deleteMany).toHaveBeenCalledWith({
      where: { rating: "UP", createdAt: { lt: cutoff(90) } },
    });
    expect(mockFeedback.deleteMany).toHaveBeenCalledWith({
      where: { rating: "DOWN", createdAt: { lt: cutoff(365) } },
    });
    // No un-scoped feedback delete: every pass names a rating.
    for (const call of mockFeedback.deleteMany.mock.calls) {
      expect(call[0].where.rating).toBeDefined();
    }
    expect(stats.feedbackUpDeleted).toBe(9);
    expect(stats.feedbackDownDeleted).toBe(1);
  });
});
