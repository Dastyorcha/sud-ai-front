import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import { queryKeys } from "@/shared/lib/query/query-keys";

/** Real-API job lifecycle (guide §9/§12) — distinct from the mock layer's
 * `JobStatus` (`src/shared/types/enums.ts`, reconciled in integration-11). */
export type JobStatus = "Queued" | "Processing" | "Succeeded" | "Failed";

/** Background job kinds the app polls for (guide §9/§12). */
export type JobType = "FinalTranscription" | "DocumentGeneration" | "DocumentPdfExport";

/** `GET /jobs/{id}` response shape (guide §9). `errorCode`/`errorMessageSafe`
 * are only present once `status === "Failed"`. */
export interface JobRecord {
  id: string;
  jobType: JobType;
  status: JobStatus;
  errorCode?: string;
  errorMessageSafe?: string;
}

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set(["Succeeded", "Failed"]);

function isTerminalStatus(status: JobStatus | undefined): boolean {
  return status !== undefined && TERMINAL_STATUSES.has(status);
}

async function fetchJob(jobId: string): Promise<JobRecord> {
  const { data } = await apiClient.get<JobRecord>(`${API_PREFIX}/jobs/${jobId}`);
  return data;
}

export interface UseJobPollingResult {
  job: JobRecord | undefined;
  query: UseQueryResult<JobRecord>;
  isTerminal: boolean;
  isSucceeded: boolean;
  isFailed: boolean;
}

/**
 * Polls `GET /jobs/{id}` (guide §9, §12) every 1.5s until the job reaches a
 * terminal status (`Succeeded`/`Failed`), then stops. Pass `null`/`undefined`
 * before a job exists yet — the query stays disabled. Callers key downstream
 * refetches (transcribe/generate/export) off `isSucceeded`; on `isFailed`,
 * read `job.errorCode`/`job.errorMessageSafe`.
 */
export function useJobPolling(jobId: string | undefined | null): UseJobPollingResult {
  const query = useQuery({
    queryKey: queryKeys.jobs.detail(jobId ?? ""),
    queryFn: () => fetchJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (q) => (isTerminalStatus(q.state.data?.status) ? false : 1500),
    refetchOnWindowFocus: false,
  });

  const status = query.data?.status;

  return {
    job: query.data,
    query,
    isTerminal: isTerminalStatus(status),
    isSucceeded: status === "Succeeded",
    isFailed: status === "Failed",
  };
}
