import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { ConversionFormat, ConversionJob, ConversionRequest, JobItem, JobUpdateEvent, MarkdownCleanupMode } from "../../shared/contracts";
import { noopMainLogger, type MainLogger } from "../logging";
import type { EnvironmentService } from "../system/environment";
import { buildPandocArgs } from "./command-builder";
import type { JobStore } from "./job-store";
import { PDF_ENGINE_MISSING_MESSAGE } from "../../shared/messages";
import { sanitizeDocxMarkdownForAi } from "./markdown-cleanup";
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

type ExecutePandoc = (args: string[], cwd: string) => Promise<void>;

type NormalizedErrorCode = "invalid_configuration" | "output_write_failed";
type ConversionFailurePatch = Pick<JobItem, "status" | "errorCode" | "errorMessage" | "errorDetails">;

type NormalizedServiceError = Error & {
  code: NormalizedErrorCode;
  cause?: unknown;
};

export class ConversionService {
  private readonly queue: QueueEntry[] = [];
  private readonly listeners = new Set<JobListener>();
  private readonly completedJobs = new Set<string>();
  private processing = false;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly jobStore: JobStore,
    private readonly executePandoc: ExecutePandoc = spawnPandoc,
    private readonly logger: MainLogger = noopMainLogger
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
    validateRequest(request);

    const items: Array<Omit<JobItem, "id" | "createdAt" | "updatedAt">> = await Promise.all(
      request.inputPaths.map(async (inputPath): Promise<Omit<JobItem, "id" | "createdAt" | "updatedAt">> => {
        const inputFormat = getFormatFromPath(inputPath);

        if (!inputFormat) {
          return buildUnsupportedFormatItem(inputPath, request.targetFormat);
        }

        if (!isSupportedConversionPath(inputFormat, request.targetFormat)) {
          return buildUnsupportedPathItem(inputPath, inputFormat, request.targetFormat);
        }

        return {
          inputPath,
          inputFormat,
          outputPath: null,
          targetFormat: request.targetFormat,
          markdownCleanupMode: normalizeMarkdownCleanupMode(request.markdownCleanupMode),
          status: "queued" as const,
          errorCode: null,
          errorMessage: null,
          errorDetails: null
        };
      })
    );

    const hasQueuedItems = items.some((item) => item.status === "queued");

    if (hasQueuedItems) {
      try {
        await ensureDirectoryExists(request.outputDirectory);
      } catch (error) {
        throw createNormalizedError("output_write_failed", "Output directory could not be created.", error);
      }
    }

    const finalizedItems = await Promise.all(
      items.map(async (item): Promise<Omit<JobItem, "id" | "createdAt" | "updatedAt">> => {
        if (item.status !== "queued") {
          return item;
        }

        const output = await resolveOutputPath(item.inputPath, request.outputDirectory, item.targetFormat, request.collisionPolicy);

        if (output.skipped) {
          return {
            ...item,
            outputPath: null,
            status: "skipped" as const,
            errorCode: null,
            errorMessage: "Skipped because the output file already exists.",
            errorDetails: null
          };
        }

        return {
          ...item,
          outputPath: output.outputPath
        };
      })
    );

    const job = this.jobStore.create(finalizedItems);
    this.logger.info("job:created", {
      jobId: job.id,
      targetFormat: request.targetFormat,
      inputCount: request.inputPaths.length,
      queuedCount: job.summary.queued,
      failedCount: job.summary.failed,
      skippedCount: job.summary.skipped
    });

    for (const item of job.items) {
      if (item.status === "queued") {
        this.queue.push({ jobId: job.id, itemId: item.id });
      }
    }

    this.emit({ job });
    this.logCompletedJobIfNeeded(job);
    void this.processQueue();
    return job;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const next = this.queue.shift();
        if (!next) {
          break;
        }

        try {
          await this.processItem(next.jobId, next.itemId);
        } catch (error) {
          this.failUnexpectedItem(next.jobId, next.itemId, error);
        }
      }
    } finally {
      this.processing = false;
    }
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
        errorMessage: "Input file was not found.",
        errorDetails: null
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
        errorMessage: "This conversion path is not available in the current MVP scaffold.",
        errorDetails: null
      });
      return;
    }

    const environment = await this.environmentService.getStatus();
    if (!environment.pandocAvailable) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "pandoc_not_found",
        errorMessage: "Pandoc is not available on PATH.",
        errorDetails: null
      });
      return;
    }

    if (item.targetFormat === "pdf" && !environment.pdfExportAvailable) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "pdf_engine_missing",
        errorMessage: PDF_ENGINE_MISSING_MESSAGE,
        errorDetails: null
      });
      return;
    }

    if (item.targetFormat === "pdf" && !environment.pdfEngineName) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "pdf_engine_missing",
        errorMessage: PDF_ENGINE_MISSING_MESSAGE,
        errorDetails: null
      });
      return;
    }

    if (item.targetFormat === "pdf" && !environment.pdfFontProfile) {
      this.update(jobId, itemId, {
        status: "failed",
        errorCode: "pdf_engine_missing",
        errorMessage: PDF_ENGINE_MISSING_MESSAGE,
        errorDetails: null
      });
      return;
    }

    this.update(jobId, itemId, { status: "processing" });

    try {
      const args = buildPandocArgs(
        item.inputPath,
        item.outputPath,
        item.inputFormat,
        item.targetFormat,
        environment.pdfEngineName,
        environment.pdfFontProfile
      );
      await this.executePandoc(args, path.dirname(item.outputPath));
      if (item.inputFormat === "docx" && item.targetFormat === "md") {
        await sanitizeMarkdownOutput(item.outputPath, item.markdownCleanupMode ?? "preserve");
      }
      this.update(jobId, itemId, { status: "success" });
    } catch (error) {
      const failurePatch = buildConversionFailurePatch(error);
      this.logger.error("pandoc:execution_failed", {
        jobId,
        itemId,
        errorCode: failurePatch.errorCode,
        processExitCode: extractProcessExitCode(error)
      });
      this.update(jobId, itemId, failurePatch);
    }
  }

  private update(jobId: string, itemId: string, patch: Partial<JobItem>): void {
    const job = this.jobStore.updateItem(jobId, itemId, patch);
    this.emit({ job, itemId });
    if (patch.status === "failed") {
      this.logger.warn("job:item_failed", {
        jobId,
        itemId,
        errorCode: patch.errorCode ?? null,
        errorDetailsPresent: patch.errorDetails !== null && patch.errorDetails !== undefined
      });
    }

    this.logCompletedJobIfNeeded(job);
  }

  private failUnexpectedItem(jobId: string, itemId: string, error: unknown): void {
    const job = this.jobStore.get(jobId);
    const item = job?.items.find((candidate) => candidate.id === itemId);

    if (!item) {
      return;
    }

    this.update(jobId, itemId, {
      status: "failed",
      errorCode: "conversion_failed",
      errorMessage: "Conversion failed.",
      errorDetails: error instanceof Error ? error.message : String(error)
    });
  }

  private emit(event: JobUpdateEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private logCompletedJobIfNeeded(job: ConversionJob): void {
    if (this.completedJobs.has(job.id) || job.items.some((item) => item.status === "queued" || item.status === "processing" || item.status === "validating")) {
      return;
    }

    this.completedJobs.add(job.id);
    this.logger.info("job:completed", {
      jobId: job.id,
      summary: job.summary,
      failedErrorCodes: job.items.filter((item) => item.status === "failed").map((item) => item.errorCode).filter((code): code is string => code !== null)
    });
  }
}

async function sanitizeMarkdownOutput(outputPath: string, cleanupMode: MarkdownCleanupMode): Promise<void> {
  if (cleanupMode !== "ai") {
    return;
  }

  const markdown = await fs.readFile(outputPath, "utf8");
  const sanitizedMarkdown = sanitizeDocxMarkdownForAi(markdown);

  if (sanitizedMarkdown !== markdown) {
    await fs.writeFile(outputPath, sanitizedMarkdown, "utf8");
  }
}

function buildUnsupportedFormatItem(
  inputPath: string,
  targetFormat: ConversionFormat
): Omit<JobItem, "id" | "createdAt" | "updatedAt"> {
  return {
    inputPath,
    inputFormat: "md",
    outputPath: null,
    targetFormat,
    markdownCleanupMode: "preserve",
    status: "failed",
    errorCode: "unsupported_format",
    errorMessage: "Unsupported file extension.",
    errorDetails: null
  };
}

function buildUnsupportedPathItem(
  inputPath: string,
  inputFormat: ConversionFormat,
  targetFormat: ConversionFormat
): Omit<JobItem, "id" | "createdAt" | "updatedAt"> {
  const errorCode = inputFormat === "pdf" && targetFormat === "md"
    ? "experimental_path_unavailable"
    : "unsupported_conversion_path";

  return {
    inputPath,
    inputFormat,
    outputPath: null,
    targetFormat,
    markdownCleanupMode: "preserve",
    status: "failed",
    errorCode,
    errorMessage: "This conversion path is not available in the current MVP scaffold.",
    errorDetails: null
  };
}

function validateRequest(request: ConversionRequest): void {
  if (request.inputPaths.length === 0) {
    throw createNormalizedError("invalid_configuration", "At least one input file is required.");
  }

  if (!request.outputDirectory.trim()) {
    throw createNormalizedError("invalid_configuration", "Output directory is required.");
  }
}

function normalizeMarkdownCleanupMode(cleanupMode: MarkdownCleanupMode | undefined): MarkdownCleanupMode {
  return cleanupMode === "ai" ? "ai" : "preserve";
}

function createNormalizedError(code: NormalizedErrorCode, message: string, cause?: unknown): NormalizedServiceError {
  const error = new Error(message) as NormalizedServiceError;
  error.code = code;
  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

function buildConversionFailurePatch(error: unknown): ConversionFailurePatch {
  const details = error instanceof Error ? error.message : String(error);

  if (isMissingPdfEngineError(details)) {
    return {
      status: "failed",
      errorCode: "pdf_engine_missing",
      errorMessage: PDF_ENGINE_MISSING_MESSAGE,
      errorDetails: details
    };
  }

  return {
    status: "failed",
    errorCode: "conversion_failed",
    errorMessage: "Conversion failed.",
    errorDetails: details
  };
}

function extractProcessExitCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const maybeExitCode = (error as { exitCode?: unknown }).exitCode;
  return typeof maybeExitCode === "number" ? maybeExitCode : null;
}

function isMissingPdfEngineError(details: string): boolean {
  return details.includes("createProcess: find_executable: failed") || details.includes("not found on PATH");
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

      const error = new Error(stderr.trim() || `Pandoc exited with code ${code}`) as Error & {
        exitCode?: number | null;
      };
      error.exitCode = code ?? null;
      reject(error);
    });
  });
}
