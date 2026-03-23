import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { EnvironmentStatus } from "../../src/shared/contracts";
import { PDF_ENGINE_MISSING_MESSAGE } from "../../src/shared/messages";
import { ConversionService } from "../../src/main/services/conversion-service";
import { JobStore } from "../../src/main/services/job-store";
import type { MainLogger } from "../../src/main/logging";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

function createEnvironmentStatus(): EnvironmentStatus {
  return {
    pandocAvailable: true,
    pandocVersion: "3.0.0",
    pdfExportAvailable: true,
    pdfEngineName: "xelatex",
    pdfFontProfile: "Apple SD Gothic Neo",
    platform: "darwin",
    issues: []
  };
}

type CreateServiceOptions = {
  environmentStatus?: EnvironmentStatus;
  getStatus?: () => Promise<EnvironmentStatus>;
  executePandoc?: (args: string[], cwd: string) => Promise<void>;
  logger?: MainLogger;
};

function createService(options: CreateServiceOptions = {}): ConversionService {
  const getStatus = options.getStatus ?? (async (): Promise<EnvironmentStatus> => options.environmentStatus ?? createEnvironmentStatus());
  return new ConversionService(
    {
      getStatus
    },
    new JobStore(),
    options.executePandoc,
    options.logger
  );
}

function createLoggerCapture() {
  const entries: Array<Record<string, unknown>> = [];
  const logger: MainLogger = {
    debug: (event, details) => {
      entries.push({ level: "debug", event, details });
    },
    info: (event, details) => {
      entries.push({ level: "info", event, details });
    },
    warn: (event, details) => {
      entries.push({ level: "warn", event, details });
    },
    error: (event, details) => {
      entries.push({ level: "error", event, details });
    }
  };

  return { entries, logger };
}

async function waitForFailedItem(service: ConversionService, jobId: string): Promise<NonNullable<ReturnType<ConversionService["getJob"]>>["items"][number]> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const job = service.getJob(jobId);
    const failedItem = job?.items.find((item) => item.status === "failed");

    if (failedItem) {
      return failedItem;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error("Timed out waiting for a failed item.");
}

async function waitForJobToSettle(service: ConversionService, jobId: string, expectedTerminalItems: number): Promise<NonNullable<ReturnType<ConversionService["getJob"]>>> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const job = service.getJob(jobId);

    if (!job) {
      throw new Error(`Unknown job: ${jobId}`);
    }

    const terminalItems = job.items.filter((item) => ["failed", "success", "skipped"].includes(item.status));
    if (terminalItems.length === expectedTerminalItems) {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error("Timed out waiting for the job to settle.");
}

describe("ConversionService.createJob", () => {
  it("fails unsupported conversion paths before creating output directories or queueing work", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    createdDirectories.push(tempRoot);
    const service = createService();

    const job = await service.createJob({
      inputPaths: ["/tmp/sample.docx"],
      targetFormat: "pdf",
      outputDirectory,
      collisionPolicy: "rename"
    });

    expect(job.items).toHaveLength(1);
    expect(job.items[0]).toMatchObject({
      inputPath: "/tmp/sample.docx",
      inputFormat: "docx",
      outputPath: null,
      targetFormat: "pdf",
      status: "failed",
      errorCode: "unsupported_conversion_path"
    });
    expect(job.summary).toMatchObject({
      total: 1,
      queued: 0,
      processing: 0,
      success: 0,
      failed: 1,
      skipped: 0
    });
    await expect(fs.access(outputDirectory)).rejects.toThrow();
  });

  it("normalizes invalid configuration when outputDirectory is empty", async () => {
    const service = createService();

    await expect(
      service.createJob({
        inputPaths: ["/tmp/sample.md"],
        targetFormat: "docx",
        outputDirectory: "   ",
        collisionPolicy: "rename"
      })
    ).rejects.toMatchObject({
      code: "invalid_configuration",
      message: "Output directory is required."
    });
  });

  it("normalizes output directory creation failures", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const blockingFile = path.join(tempRoot, "blocked");
    createdDirectories.push(tempRoot);
    await fs.writeFile(blockingFile, "not-a-directory");

    const service = createService();

    await expect(
      service.createJob({
        inputPaths: ["/tmp/sample.md"],
        targetFormat: "docx",
        outputDirectory: blockingFile,
        collisionPolicy: "rename"
      })
    ).rejects.toMatchObject({
      code: "output_write_failed",
      message: "Output directory could not be created."
    });
  });

  it("marks missing input files with input_not_found during processing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    createdDirectories.push(tempRoot);

    const service = createService();

    const job = await service.createJob({
      inputPaths: [path.join(tempRoot, "missing.md")],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const failedItem = await waitForFailedItem(service, job.id);
    expect(failedItem).toMatchObject({
      inputPath: path.join(tempRoot, "missing.md"),
      status: "failed",
      errorCode: "input_not_found",
      errorMessage: "Input file was not found."
    });
  });

  it("normalizes invalid configuration when inputPaths is empty", async () => {
    const service = createService();

    await expect(
      service.createJob({
        inputPaths: [],
        targetFormat: "docx",
        outputDirectory: "/tmp/out",
        collisionPolicy: "rename"
      })
    ).rejects.toMatchObject({
      code: "invalid_configuration",
      message: "At least one input file is required."
    });
  });

  it("marks queued items as pandoc_not_found when the environment reports no pandoc", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const service = createService({
      environmentStatus: {
        ...createEnvironmentStatus(),
        pandocAvailable: false
      }
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const failedItem = await waitForFailedItem(service, job.id);
    expect(failedItem).toMatchObject({
      inputPath,
      status: "failed",
      errorCode: "pandoc_not_found",
      errorMessage: "Pandoc is not available on PATH."
    });
  });

  it("marks markdown to pdf items as pdf_engine_missing when no PDF engine is available", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const service = createService({
      environmentStatus: {
        ...createEnvironmentStatus(),
        pdfExportAvailable: false,
        pdfEngineName: null,
        pdfFontProfile: "Apple SD Gothic Neo"
      }
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "pdf",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const failedItem = await waitForFailedItem(service, job.id);
    expect(failedItem).toMatchObject({
      inputPath,
      status: "failed",
      errorCode: "pdf_engine_missing",
      errorMessage: PDF_ENGINE_MISSING_MESSAGE
    });
  });

  it("passes the resolved PDF engine to Pandoc for markdown to pdf jobs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const calls: Array<{ args: string[]; cwd: string }> = [];
    const service = createService({
      executePandoc: async (args, cwd) => {
        calls.push({ args, cwd });
      }
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "pdf",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const settledJob = await waitForJobToSettle(service, job.id, 1);
    expect(settledJob.items[0]).toMatchObject({
      inputPath,
      status: "success"
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toContain("--pdf-engine=xelatex");
    expect(calls[0]?.args).toContain("mainfont=Apple SD Gothic Neo");
    expect(calls[0]?.args).toContain("CJKmainfont=Apple SD Gothic Neo");
  });

  it("treats missing PDF engine execution errors as pdf_engine_missing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const { entries, logger } = createLoggerCapture();
    const service = createService({
      logger,
      executePandoc: async () => {
        throw new Error("pdflatex: createProcess: find_executable: failed (errnoToString failed)");
      }
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "pdf",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const failedItem = await waitForFailedItem(service, job.id);
    expect(failedItem).toMatchObject({
      inputPath,
      status: "failed",
      errorCode: "pdf_engine_missing",
      errorMessage: PDF_ENGINE_MISSING_MESSAGE,
      errorDetails: "pdflatex: createProcess: find_executable: failed (errnoToString failed)"
    });
    expect(entries).toContainEqual({
      level: "error",
      event: "pandoc:execution_failed",
      details: {
        jobId: job.id,
        itemId: failedItem.id,
        errorCode: "pdf_engine_missing",
        processExitCode: null
      }
    });
  });

  it("emits lifecycle logs for job creation and completion", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const { entries, logger } = createLoggerCapture();
    const service = createService({
      logger,
      executePandoc: async () => undefined
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const settledJob = await waitForJobToSettle(service, job.id, 1);
    expect(settledJob.summary).toMatchObject({
      total: 1,
      queued: 0,
      processing: 0,
      success: 1,
      failed: 0,
      skipped: 0
    });
    expect(entries).toContainEqual({
      level: "info",
      event: "job:created",
      details: {
        jobId: job.id,
        targetFormat: "docx",
        inputCount: 1,
        queuedCount: 1,
        failedCount: 0,
        skippedCount: 0
      }
    });
    expect(entries).toContainEqual({
      level: "info",
      event: "job:completed",
      details: {
        jobId: job.id,
        summary: settledJob.summary,
        failedErrorCodes: []
      }
    });
  });

  it("logs normalized error categories and Pandoc exit codes when execution fails", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const { entries, logger } = createLoggerCapture();
    const service = createService({
      logger,
      executePandoc: async () => {
        const error = new Error("Pandoc exited with code 2") as Error & { exitCode?: number };
        error.exitCode = 2;
        throw error;
      }
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const failedItem = await waitForFailedItem(service, job.id);
    expect(failedItem).toMatchObject({
      inputPath,
      status: "failed",
      errorCode: "conversion_failed",
      errorMessage: "Conversion failed.",
      errorDetails: "Pandoc exited with code 2"
    });
    expect(entries).toContainEqual({
      level: "error",
      event: "pandoc:execution_failed",
      details: {
        jobId: job.id,
        itemId: failedItem.id,
        errorCode: "conversion_failed",
        processExitCode: 2
      }
    });
    expect(entries).toContainEqual({
      level: "warn",
      event: "job:item_failed",
      details: {
        jobId: job.id,
        itemId: failedItem.id,
        errorCode: "conversion_failed",
        errorDetailsPresent: true
      }
    });
  });

  it("continues processing later queue items when one item throws unexpectedly", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const firstInput = path.join(tempRoot, "first.md");
    const secondInput = path.join(tempRoot, "second.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(firstInput, "# first");
    await fs.writeFile(secondInput, "# second");

    let statusCalls = 0;
    const service = new ConversionService(
      {
        getStatus: async (): Promise<EnvironmentStatus> => {
          statusCalls += 1;

          if (statusCalls === 1) {
            throw new Error("Environment probe crashed unexpectedly.");
          }

          return {
            ...createEnvironmentStatus(),
            pandocAvailable: false
          };
        }
      },
      new JobStore()
    );

    const job = await service.createJob({
      inputPaths: [firstInput, secondInput],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const settledJob = await waitForJobToSettle(service, job.id, 2);
    expect(settledJob.items).toHaveLength(2);
    expect(settledJob.items[0]).toMatchObject({
      inputPath: firstInput,
      status: "failed",
      errorCode: "conversion_failed",
      errorMessage: "Conversion failed.",
      errorDetails: "Environment probe crashed unexpectedly."
    });
    expect(settledJob.items[1]).toMatchObject({
      inputPath: secondInput,
      status: "failed",
      errorCode: "pandoc_not_found",
      errorMessage: "Pandoc is not available on PATH."
    });
    expect(settledJob.summary).toMatchObject({
      total: 2,
      queued: 0,
      processing: 0,
      success: 0,
      failed: 2,
      skipped: 0
    });
  });

  it("keeps mixed success and failure items isolated within the same batch", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const firstInput = path.join(tempRoot, "first.md");
    const secondInput = path.join(tempRoot, "second.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(firstInput, "# first");
    await fs.writeFile(secondInput, "# second");

    const service = createService({
      executePandoc: async (args) => {
        if (args[0] === secondInput) {
          throw new Error("Pandoc failed for second input.");
        }
      }
    });

    const job = await service.createJob({
      inputPaths: [firstInput, secondInput],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const settledJob = await waitForJobToSettle(service, job.id, 2);
    expect(settledJob.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          inputPath: firstInput,
          status: "success",
          errorCode: null,
          errorMessage: null
        }),
        expect.objectContaining({
          inputPath: secondInput,
          status: "failed",
          errorCode: "conversion_failed",
          errorMessage: "Conversion failed.",
          errorDetails: "Pandoc failed for second input."
        })
      ])
    );
    expect(settledJob.summary).toMatchObject({
      total: 2,
      queued: 0,
      processing: 0,
      success: 1,
      failed: 1,
      skipped: 0
    });
  });

  it("uses the Windows Korean font profile when the environment reports win32", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const inputPath = path.join(tempRoot, "sample.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(inputPath, "# sample");

    const calls: Array<{ args: string[]; cwd: string }> = [];
    const service = createService({
      environmentStatus: {
        ...createEnvironmentStatus(),
        platform: "win32",
        pdfFontProfile: "Malgun Gothic"
      },
      executePandoc: async (args, cwd) => {
        calls.push({ args, cwd });
      }
    });

    const job = await service.createJob({
      inputPaths: [inputPath],
      targetFormat: "pdf",
      outputDirectory,
      collisionPolicy: "rename"
    });

    const settledJob = await waitForJobToSettle(service, job.id, 1);
    expect(settledJob.items[0]).toMatchObject({
      inputPath,
      status: "success"
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toContain("mainfont=Malgun Gothic");
    expect(calls[0]?.args).toContain("CJKmainfont=Malgun Gothic");
  });

  it("processes queued items serially so the second item does not start before the first finishes", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    const firstInput = path.join(tempRoot, "first.md");
    const secondInput = path.join(tempRoot, "second.md");
    createdDirectories.push(tempRoot);
    await fs.writeFile(firstInput, "# first");
    await fs.writeFile(secondInput, "# second");

    const callOrder: string[] = [];
    let resolveFirstStarted!: () => void;
    let releaseFirst!: () => void;

    const firstStarted = new Promise<void>((resolve) => {
      resolveFirstStarted = resolve;
    });
    const firstFinished = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const service = createService({
      executePandoc: async (args) => {
        callOrder.push(args[0]);

        if (args[0] === firstInput) {
          resolveFirstStarted();
          await firstFinished;
        }
      }
    });

    const job = await service.createJob({
      inputPaths: [firstInput, secondInput],
      targetFormat: "docx",
      outputDirectory,
      collisionPolicy: "rename"
    });

    await firstStarted;
    expect(callOrder).toEqual([firstInput]);
    expect(service.getJob(job.id)?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          inputPath: firstInput,
          status: "processing"
        }),
        expect.objectContaining({
          inputPath: secondInput,
          status: "queued"
        })
      ])
    );

    releaseFirst();

    const settledJob = await waitForJobToSettle(service, job.id, 2);
    expect(callOrder).toEqual([firstInput, secondInput]);
    expect(settledJob.summary).toMatchObject({
      total: 2,
      queued: 0,
      processing: 0,
      success: 2,
      failed: 0,
      skipped: 0
    });
  });
});
