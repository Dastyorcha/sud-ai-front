/**
 * Mock background-job service (spec §15 Jobs, §17.4). `startJob` creates a
 * job that progresses to SUCCEEDED over ~4s of polling — enough to exercise
 * every job-driven flow (finalize, extraction, generation, export).
 */
import { delay } from "@/shared/lib/mock-api/delay";
import type { Job } from "@/shared/types/models";

const jobs = new Map<string, Job & { startedAtMs: number; durationMs: number }>();

export async function startJob(type: string, durationMs = 4_000): Promise<Job> {
  await delay(150);
  const now = new Date().toISOString();
  const job: Job & { startedAtMs: number; durationMs: number } = {
    id: crypto.randomUUID(),
    type,
    status: "QUEUED",
    progress: 0,
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    startedAtMs: Date.now(),
    durationMs,
  };
  jobs.set(job.id, job);
  return job;
}

/** Poll a job — progress advances with wall-clock time (spec `GET /jobs/:id`). */
export async function getJob(id: string): Promise<Job | null> {
  await delay(120);
  const job = jobs.get(id);
  if (!job) return null;
  const elapsed = Date.now() - job.startedAtMs;
  const progress = Math.min(100, Math.round((elapsed / job.durationMs) * 100));
  const status = progress >= 100 ? "SUCCEEDED" : progress > 5 ? "RUNNING" : "QUEUED";
  const updated = { ...job, progress, status: status as Job["status"], updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}
