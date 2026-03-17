import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { ConversionJob, ConversionRequest, JobItem, JobUpdateEvent } from "../../shared/contracts";
import { EnvironmentService } from "../system/environment";
import { buildPandocArgs } from "./command-builder";
import { JobStore } from "./job-store";
import {
  ensureDirectoryExists,
  getFormatFromPath,
  isSupportedConversionPath,
  resolveOutputPath
} from "./paths";

type JobListener = (event: JobUpdateEvent) => void;

type QueueEntry = {
  jobId: string;
  itemId: string;
};

export class ConversionService {
  private readonly queue: QueueEntry[] = [];
  private readonly listeners = new Set<JobListener>();
  private processing = false;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly jobStore: JobStore
  ) {}

  subscribe(listener: JobListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  listJobs(): ConversionJob[] {
    return this.jobStore.list();
  }

  getJob(jobId: string): ConversionJob | null {
    return this.jobStore.get(jobId);
  }

  async createJob(request: ConversionRequest): Promise<ConversionJob> {
    await ensureDirectoryExists(request.outputDirectory);

    const items = await Promise.all(
      request.inputPaths.map(async (inputPath) => {
        const inputFormat = getFormatFromPath(inputPath);

        if (!inputFormat) {
          return {
            inputPath,
            inputFormat: "md",
            outputPath: null,
            targetFormat: request.targetFormat,
            status: "failed" as const,
            errorCode: "unsupported_format",
            errorMessage: "Unsupported file extension."
          };
        }

        const output = await resolveOutputPath(inputPath, request.outputDirectory, request.targetFormat, request.collisionPolicy);

        if (output.skipped) {
          return {
            inputPath,
            inputFormat,
            outputPath: null,
            targetFormat: request.targetFormat,
            status: "skipped" as const,
            errorCode: null,
            errorMessage: "Skipped because the output file already exists."
          };
        }

        return {
          inputPath,
          inputFormat,
          outputPath: output.outputPath,
          targetFormat: request.targetFormat,
          status: "queued" as const,
          errorCode: null,
          errorMessage: null
        };
      })
    );

    const job = this.jobStore.create(items);

    for (const item of job.items) {
      if (item.status === "queued") {
        this.queue.push({ jobId: job.id, itemId: item.id });
      }
    }

    this.emit({ job });
    void this.processQueue();
    return job;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) {
        break;
      }

      await this.processItem(next.jobId, next.itemId);
    }

    this.processing = false;
  }

  private async processItem(jobId: string, itemId: string): Promise<void> {
    const currentJob = this.jobStore.get(jobId);
    const item = currentJob?.items.find((candidate) => candidate.id === itemId);

    if (!item || !item.outputPath) {
      return;
    }

    this.update(jobId, itemId, { status: "validating" });

    try {
      await fs.access(item.inputPath);
    } catch {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "input_not_found",
        errorMessage: "Input file was not found."
      });
      return;
    }

    if (!isSupportedConversionPath(item.inputFormat, item.targetFormat)) {
      const errorCode = item.inputFormat === "pdf" && item.targetFormat === "md"
        ? "experimental_path_unavailable"
        : "unsupported_conversion_path";

      this.update(jobId, itemId, {
        status: "failed",
        errorCode,
        errorMessage: "This conversion path is not available in the current MVP scaffold."
      });
      return;
    }

    const environment = await this.environmentService.getStatus();
    if (!environment.pandocAvailable) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "pandoc_not_found",
        errorMessage: "Pandoc is not available on PATH."
      });
      return;
    }

    if (item.targetFormat === "pdf" && !environment.pdfExportAvailable) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "pdf_engine_missing",
        errorMessage: "A PDF engine was not detected for Markdown to PDF export."
      });
      return;
    }

    this.update(jobId, itemId, { status: "processing" });

    try {
      const args = buildPandocArgs(item.inputPath, item.outputPath, item.inputFormat, item.targetFormat);
      await spawnPandoc(args, path.dirname(item.outputPath));
      this.update(jobId, itemId, { status: "success" });
    } catch (error) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "conversion_failed",
        errorMessage: error instanceof Error ? error.message : "Pandoc execution failed."
      });
    }
  }

  private update(jobId: string, itemId: string, patch: Partial<JobItem>): void {
    const job = this.jobStore.updateItem(jobId, itemId, patch);
    this.emit({ job, itemId });
  }

  private emit(event: JobUpdateEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

function spawnPandoc(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pandoc", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `Pandoc exited with code ${code}`));
    });
  });
}
