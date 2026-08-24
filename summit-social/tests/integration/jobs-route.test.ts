// Scheduled-job endpoint: secret-gated, audited via JobRun
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    jobRun: { create: vi.fn(), update: vi.fn() },
    adventureView: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    itinerary: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { POST } from "@/app/api/jobs/[job]/route";
import { prisma } from "@/lib/db/prisma";

const mockJobRun = prisma.jobRun as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockViews = prisma.adventureView as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockNotifications = prisma.notification as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockItinerary = prisma.itinerary as unknown as Record<string, ReturnType<typeof vi.fn>>;

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
