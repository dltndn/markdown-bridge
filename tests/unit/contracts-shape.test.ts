import { describe, expect, it } from "vitest";
import type { ConversionJob, EnvironmentStatus, JobUpdateEvent } from "../../src/shared/contracts";

describe("shared contract shapes", () => {
  it("keeps JobUpdateEvent stable", () => {
    const event: JobUpdateEvent = {
      job: {
        id: "job-123",
        items: [
          {
            id: "item-123",
            inputPath: "/tmp/sample.md",
            inputFormat: "md",
            outputPath: "/tmp/sample.pdf",
            targetFormat: "pdf",
            status: "success",
            errorCode: null,
            errorMessage: null,
            errorDetails: null,
            createdAt: "2026-03-18T00:00:00.000Z",
            updatedAt: "2026-03-18T00:00:00.000Z"
          }
        ],
        summary: {
          total: 1,
          queued: 0,
          processing: 0,
          success: 1,
          failed: 0,
          skipped: 0
        }
      },
      itemId: "item-123"
    };

    expect(event).toStrictEqual({
      job: {
        id: "job-123",
        items: [
          {
            id: "item-123",
            inputPath: "/tmp/sample.md",
            inputFormat: "md",
            outputPath: "/tmp/sample.pdf",
            targetFormat: "pdf",
            status: "success",
            errorCode: null,
            errorMessage: null,
            errorDetails: null,
            createdAt: "2026-03-18T00:00:00.000Z",
            updatedAt: "2026-03-18T00:00:00.000Z"
          }
        ],
        summary: {
          total: 1,
          queued: 0,
          processing: 0,
          success: 1,
          failed: 0,
          skipped: 0
        }
      },
      itemId: "item-123"
    });
  });

  it("keeps ConversionJob.summary stable", () => {
    const summary: ConversionJob["summary"] = {
      total: 2,
      queued: 1,
      processing: 1,
      success: 0,
      failed: 0,
      skipped: 0
    };

    expect(summary).toStrictEqual({
      total: 2,
      queued: 1,
      processing: 1,
      success: 0,
      failed: 0,
      skipped: 0
    });
  });

  it("keeps EnvironmentStatus stable", () => {
    const status: EnvironmentStatus = {
      pandocAvailable: true,
      pandocVersion: "pandoc 3.7.0",
      pdfExportAvailable: false,
      pdfEngineName: null,
      pdfFontProfile: null,
      platform: "unsupported",
      issues: [
        {
          code: "unsupported_platform",
          message: "This scaffold currently targets macOS and Windows."
        }
      ]
    };

    expect(status).toStrictEqual({
      pandocAvailable: true,
      pandocVersion: "pandoc 3.7.0",
      pdfExportAvailable: false,
      pdfEngineName: null,
      pdfFontProfile: null,
      platform: "unsupported",
      issues: [
        {
          code: "unsupported_platform",
          message: "This scaffold currently targets macOS and Windows."
        }
      ]
    });
  });
});
