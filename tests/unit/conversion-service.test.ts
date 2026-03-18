import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { EnvironmentStatus } from "../../src/shared/contracts";
import { ConversionService } from "../../src/main/services/conversion-service";
import { JobStore } from "../../src/main/services/job-store";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

function createEnvironmentStatus(): EnvironmentStatus {
  return {
    pandocAvailable: true,
    pandocVersion: "3.0.0",
    pdfExportAvailable: true,
    platform: "darwin",
    issues: []
  };
}

function createService(): ConversionService {
  return new ConversionService(
    {
      getStatus: async (): Promise<EnvironmentStatus> => createEnvironmentStatus()
    },
    new JobStore()
  );
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
});
