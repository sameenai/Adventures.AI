import { runCadenceScan } from "@/lib/jobs/cadence";
import { runRetention } from "@/lib/jobs/retention";

export type JobResult = Record<string, number>;

/**
 * Registry of background jobs runnable via POST /api/jobs/[job].
 * Cloud Scheduler (see Makefile `scheduler-setup`) invokes them on a cron;
 * each run is recorded in the JobRun table for observability.
 */
export const JOBS: Record<string, () => Promise<JobResult>> = {
  retention: async () => {
    const stats = await runRetention();
    return { ...stats };
  },
  "cadence-scan": async () => {
    const stats = await runCadenceScan();
    return { ...stats };
  },
};

export function isKnownJob(name: string): boolean {
  return Object.hasOwn(JOBS, name);
}
