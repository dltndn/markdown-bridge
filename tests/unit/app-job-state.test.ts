import { describe, expect, it } from "vitest";
import type { ConversionJob, JobUpdateEvent } from "../../src/shared/contracts";
import { mergeJobUpdate, upsertJob } from "../../src/renderer/app/job-state";

function createJob(id: string, total: number): ConversionJob {
  return {
    id,
    items: [],
    summary: {
      total,
      queued: 0,
      processing: 0,
      success: 0,
      failed: 0,
      skipped: 0
    }
  };
}

describe("app job state", () => {
  it("puts a created job at the top of the list", () => {
    const existing = createJob("job-1", 1);
    const next = createJob("job-2", 2);

    expect(upsertJob([existing], next)).toEqual([next, existing]);
  });

  it("replaces a subscription update in place", () => {
    const current = [createJob("job-1", 1), createJob("job-2", 2)];
    const updated = createJob("job-2", 3);
    const event: JobUpdateEvent = {
      job: updated
    };

    expect(mergeJobUpdate(current, event)).toEqual([current[0], updated]);
  });
});
