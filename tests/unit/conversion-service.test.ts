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

describe("ConversionService.createJob", () => {
  it("fails unsupported conversion paths before creating output directories or queueing work", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    const outputDirectory = path.join(tempRoot, "out");
    createdDirectories.push(tempRoot);

    const service = new ConversionService(
      {
        getStatus: async (): Promise<EnvironmentStatus> => ({
          pandocAvailable: true,
          pandocVersion: "3.0.0",
          pdfExportAvailable: true,
          platform: "darwin",
          issues: []
        })
      },
      new JobStore()
    );

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
});
