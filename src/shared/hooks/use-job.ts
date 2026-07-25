import { useEffect, useState } from "react";
import { getJob } from "@/shared/lib/mock-api/job.service";
import type { Job } from "@/shared/types/models";

/**
 * Polls a background job at 1s until it reaches a terminal state (spec
 * Phase-02 Step 2.6). Pass `null` to idle. Used by finalize, event
 * extraction, document generation and export flows.
 */
export function useJob(jobId: string | null): Job | null {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let cancelled = false;

    async function poll() {
      const result = await getJob(jobId as string);
      if (cancelled) return;
      setJob(result);
      if (result && result.status !== "SUCCEEDED" && result.status !== "FAILED") {
        timer = setTimeout(() => void poll(), 1_000);
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  return job;
}
