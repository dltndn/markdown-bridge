import crypto from "node:crypto";
import type { ConversionJob, JobItem, JobItemStatus } from "../../shared/contracts";

export class JobStore {
  private readonly jobs = new Map<string, ConversionJob>();

  list(): ConversionJob[] {
    return Array.from(this.jobs.values());
  }

  get(jobId: string): ConversionJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  create(items: Omit<JobItem, "id" | "createdAt" | "updatedAt">[]): ConversionJob {
    const now = new Date().toISOString();
    const job: ConversionJob = {
      id: crypto.randomUUID(),
      items: items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      })),
      summary: {
        total: items.length,
        queued: items.length,
        processing: 0,
        success: 0,
        failed: 0,
        skipped: 0
      }
    };

    this.jobs.set(job.id, job);
    return job;
  }

  updateItem(jobId: string, itemId: string, patch: Partial<JobItem>): ConversionJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Unknown job: ${jobId}`);
    }

    job.items = job.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            ...patch,
            updatedAt: new Date().toISOString()
          }
        : item
    );
    job.summary = summarize(job.items);
    this.jobs.set(job.id, job);
    return job;
  }
}

function summarize(items: JobItem[]): ConversionJob["summary"] {
  const counts: Record<JobItemStatus, number> = {
    queued: 0,
    validating: 0,
    processing: 0,
    success: 0,
    failed: 0,
    skipped: 0
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return {
    total: items.length,
    queued: counts.queued + counts.validating,
    processing: counts.processing,
    success: counts.success,
    failed: counts.failed,
    skipped: counts.skipped
  };
}

