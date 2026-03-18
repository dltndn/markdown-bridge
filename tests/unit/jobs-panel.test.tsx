import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JobsPanel } from "../../src/renderer/features/jobs/JobsPanel";

describe("JobsPanel", () => {
  it("renders the batch summary and open output folder action when job output paths exist", () => {
    const markup = renderToStaticMarkup(
      <JobsPanel
        jobs={[
          {
            id: "job-1",
            items: [
              {
                id: "item-0",
                inputPath: "/tmp/queued.md",
                inputFormat: "md",
                outputPath: null,
                targetFormat: "docx",
                status: "queued",
                errorCode: null,
                errorMessage: null,
                errorDetails: null,
                createdAt: "2026-03-18T00:00:00.000Z",
                updatedAt: "2026-03-18T00:00:00.000Z"
              },
              {
                id: "item-1",
                inputPath: "/tmp/processing.md",
                inputFormat: "md",
                outputPath: null,
                targetFormat: "docx",
                status: "processing",
                errorCode: null,
                errorMessage: null,
                errorDetails: null,
                createdAt: "2026-03-18T00:00:00.000Z",
                updatedAt: "2026-03-18T00:00:00.000Z"
              },
              {
                id: "item-2",
                inputPath: "/tmp/sample.md",
                inputFormat: "md",
                outputPath: "/tmp/out/sample.docx",
                targetFormat: "docx",
                status: "success",
                errorCode: null,
                errorMessage: null,
                errorDetails: null,
                createdAt: "2026-03-18T00:00:00.000Z",
                updatedAt: "2026-03-18T00:00:00.000Z"
              }
            ],
            summary: {
              total: 3,
              queued: 1,
              processing: 1,
              success: 1,
              failed: 0,
              skipped: 0
            }
          }
        ]}
        onOpenOutputFolder={vi.fn()}
      />
    );

    expect(markup).toContain("3");
    expect(markup).toContain("queued");
    expect(markup).toContain("processing");
    expect(markup).toContain("Open output folder");
    expect(markup).toContain("Job job-1");
  });

  it("renders failed item messages and details", () => {
    const markup = renderToStaticMarkup(
      <JobsPanel
        jobs={[
          {
            id: "job-2",
            items: [
              {
                id: "item-2",
                inputPath: "/tmp/sample.md",
                inputFormat: "md",
                outputPath: null,
                targetFormat: "pdf",
                status: "failed",
                errorCode: "conversion_failed",
                errorMessage: "Conversion failed.",
                errorDetails: "Pandoc exited with code 1",
                createdAt: "2026-03-18T00:00:00.000Z",
                updatedAt: "2026-03-18T00:00:00.000Z"
              }
            ],
            summary: {
              total: 1,
              queued: 0,
              processing: 0,
              success: 0,
              failed: 1,
              skipped: 0
            }
          }
        ]}
        onOpenOutputFolder={vi.fn()}
      />
    );

    expect(markup).toContain("Conversion failed.");
    expect(markup).toContain("Details: Pandoc exited with code 1");
    expect(markup).toContain("failed");
  });
});
