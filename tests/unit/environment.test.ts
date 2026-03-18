import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentService } from "../../src/main/system/environment";
import { probeCommand } from "../../src/main/system/command";

vi.mock("../../src/main/system/command", () => ({
  probeCommand: vi.fn()
}));

const probeCommandMock = vi.mocked(probeCommand);

describe("EnvironmentService", () => {
  beforeEach(() => {
    probeCommandMock.mockReset();
  });

  it("reports pandoc and PDF export as available when a PDF engine is detected", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "pandoc") {
        return {
          available: true,
          output: "pandoc 3.7.0\nCompiled with ..."
        };
      }

      if (command === "wkhtmltopdf") {
        return {
          available: true,
          output: "wkhtmltopdf 0.12.6"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService().getStatus();

    expect(status.pandocAvailable).toBe(true);
    expect(status.pandocVersion).toBe("pandoc 3.7.0");
    expect(status.pdfExportAvailable).toBe(true);
    expect(status.issues.find((issue) => issue.code === "pandoc_not_found")).toBeUndefined();
    expect(status.issues.find((issue) => issue.code === "pdf_engine_missing")).toBeUndefined();
  });

  it("keeps PDF export unavailable when pandoc is missing even if a PDF engine exists", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "wkhtmltopdf") {
        return {
          available: true,
          output: "wkhtmltopdf 0.12.6"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService().getStatus();

    expect(status.pandocAvailable).toBe(false);
    expect(status.pandocVersion).toBeNull();
    expect(status.pdfExportAvailable).toBe(false);
    expect(status.issues).toContainEqual({
      code: "pandoc_not_found",
      message: "Pandoc was not found on PATH. Install Pandoc before creating conversion jobs."
    });
    expect(status.issues.find((issue) => issue.code === "pdf_engine_missing")).toBeUndefined();
  });

  it("reports missing PDF engine when pandoc is available but no supported engine is found", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "pandoc") {
        return {
          available: true,
          output: "pandoc 3.7.0"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService().getStatus();

    expect(status.pandocAvailable).toBe(true);
    expect(status.pandocVersion).toBe("pandoc 3.7.0");
    expect(status.pdfExportAvailable).toBe(false);
    expect(status.issues).toContainEqual({
      code: "pdf_engine_missing",
      message: "Markdown to PDF export needs a PDF engine such as wkhtmltopdf, WeasyPrint, LaTeX, or Tectonic."
    });
  });
});
