import { prisma } from "@/lib/db/prisma";
import { JOBS, isKnownJob } from "@/lib/jobs/registry";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const maxDuration = 300;

/**
 * Scheduled-job entrypoint. Not a user surface: callers must present the
 * shared JOBS_SECRET (Cloud Scheduler sends it as a header). Every run is
 * recorded in JobRun so a silently failing schedule is visible.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;

  const secret = process.env.JOBS_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Jobs are not configured", code: "JOBS_DISABLED" },
      { status: 503 },
    );
  }
  const presented = request.headers.get("x-jobs-secret");
  if (presented !== secret) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!isKnownJob(job)) {
    return NextResponse.json({ error: "Unknown job", code: "NOT_FOUND" }, { status: 404 });
  }

  const run = await prisma.jobRun.create({
    data: { jobName: job, status: "RUNNING" },
  });

  try {
    const stats = await JOBS[job]();
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: "SUCCEEDED", finishedAt: new Date(), stats },
    });
    return NextResponse.json({ job, status: "SUCCEEDED", stats });
  } catch (err) {
    logger.error(`Job ${job} failed`, err);
    await prisma.jobRun
      .update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          stats: { error: err instanceof Error ? err.message : "unknown" },
        },
      })
      .catch(() => undefined);
    return NextResponse.json(
      { job, status: "FAILED", error: "Job failed", code: "JOB_FAILED" },
      { status: 500 },
    );
  }
}
