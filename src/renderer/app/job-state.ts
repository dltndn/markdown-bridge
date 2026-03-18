import type { ConversionJob, JobUpdateEvent } from "../../shared/contracts";

export function upsertJob(currentJobs: ConversionJob[], job: ConversionJob): ConversionJob[] {
  return [job, ...currentJobs.filter((existing) => existing.id !== job.id)];
}

export function mergeJobUpdate(currentJobs: ConversionJob[], event: JobUpdateEvent): ConversionJob[] {
  const existing = currentJobs.find((job) => job.id === event.job.id);
  if (!existing) {
    return [event.job, ...currentJobs];
  }

  return currentJobs.map((job) => (job.id === event.job.id ? event.job : job));
}
