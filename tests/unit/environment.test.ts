import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentService } from "../../src/main/system/environment";
import { probeCommand } from "../../src/main/system/command";
import { PDF_ENGINE_MISSING_MESSAGE } from "../../src/shared/messages";

vi.mock("../../src/main/system/command", () => ({
  probeCommand: vi.fn()
}));

const probeCommandMock = vi.mocked(probeCommand);

describe("EnvironmentService", () => {
  beforeEach(() => {
    probeCommandMock.mockReset();
  });

  it("emits a structured environment status log with issue codes", async () => {
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

    const entries: Array<Record<string, unknown>> = [];
    const logger = {
      debug: vi.fn(),
      info: vi.fn((event: string, details?: Record<string, unknown>) => {
        entries.push({
          level: "info",
          event,
          details
        });
      }),
      warn: vi.fn(),
      error: vi.fn()
    };

    const status = await new EnvironmentService("darwin", logger).getStatus();

    expect(status.issues).toContainEqual({
      code: "pdf_engine_missing",
      message: PDF_ENGINE_MISSING_MESSAGE
    });
    expect(entries).toContainEqual({
      level: "info",
      event: "environment:checked",
      details: {
        pandocAvailable: true,
        pandocVersion: "pandoc 3.7.0",
        pdfExportAvailable: false,
        pdfEngineName: null,
        pdfFontProfile: "Apple SD Gothic Neo",
        platform: "darwin",
        issueCodes: ["pdf_engine_missing"]
      }
    });
  });

  it("reports pandoc and PDF export as available when xelatex is detected", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "pandoc") {
        return {
          available: true,
          output: "pandoc 3.7.0\nCompiled with ..."
        };
      }

      if (command === "xelatex") {
        return {
          available: true,
          output: "XeTeX 3.141592653"
        };
      }

      if (command === "kpsewhich") {
        return {
          available: true,
          output: "/usr/local/texlive/texmf-dist/tex/xelatex/xecjk/xeCJK.sty"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService("darwin").getStatus();

    expect(status.pandocAvailable).toBe(true);
    expect(status.pandocVersion).toBe("pandoc 3.7.0");
    expect(status.pdfExportAvailable).toBe(true);
    expect(status.pdfEngineName).toBe("xelatex");
    expect(status.pdfFontProfile).toBe("Apple SD Gothic Neo");
    expect(status.issues.find((issue) => issue.code === "pandoc_not_found")).toBeUndefined();
    expect(status.issues.find((issue) => issue.code === "pdf_engine_missing")).toBeUndefined();
  });

  it("keeps PDF export unavailable when pandoc is missing even if xelatex exists", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "xelatex") {
        return {
          available: true,
          output: "XeTeX 3.141592653"
        };
      }

      if (command === "kpsewhich") {
        return {
          available: true,
          output: "/usr/local/texlive/texmf-dist/tex/xelatex/xecjk/xeCJK.sty"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService("darwin").getStatus();

    expect(status.pandocAvailable).toBe(false);
    expect(status.pandocVersion).toBeNull();
    expect(status.pdfExportAvailable).toBe(false);
    expect(status.pdfEngineName).toBe("xelatex");
    expect(status.pdfFontProfile).toBe("Apple SD Gothic Neo");
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

    const status = await new EnvironmentService("darwin").getStatus();

    expect(status.pandocAvailable).toBe(true);
    expect(status.pandocVersion).toBe("pandoc 3.7.0");
    expect(status.pdfExportAvailable).toBe(false);
    expect(status.pdfEngineName).toBeNull();
    expect(status.pdfFontProfile).toBe("Apple SD Gothic Neo");
    expect(status.issues).toContainEqual({
      code: "pdf_engine_missing",
      message: PDF_ENGINE_MISSING_MESSAGE
    });
  });

  it("reports missing PDF engine when xelatex exists but xeCJK is not installed", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "pandoc") {
        return {
          available: true,
          output: "pandoc 3.7.0"
        };
      }

      if (command === "xelatex") {
        return {
          available: true,
          output: "XeTeX 3.141592653"
        };
      }

      if (command === "kpsewhich") {
        return {
          available: false,
          output: null
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService("darwin").getStatus();

    expect(status.pandocAvailable).toBe(true);
    expect(status.pandocVersion).toBe("pandoc 3.7.0");
    expect(status.pdfExportAvailable).toBe(false);
    expect(status.pdfEngineName).toBeNull();
    expect(status.pdfFontProfile).toBe("Apple SD Gothic Neo");
    expect(status.issues).toContainEqual({
      code: "pdf_engine_missing",
      message: PDF_ENGINE_MISSING_MESSAGE
    });
  });

  it("does not treat tectonic alone as sufficient for PDF export", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "pandoc") {
        return {
          available: true,
          output: "pandoc 3.7.0"
        };
      }

      if (command === "tectonic") {
        return {
          available: true,
          output: "tectonic 0.15.0"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService("darwin").getStatus();

    expect(status.pdfExportAvailable).toBe(false);
    expect(status.pdfEngineName).toBeNull();
    expect(status.pdfFontProfile).toBe("Apple SD Gothic Neo");
    expect(status.issues).toContainEqual({
      code: "pdf_engine_missing",
      message: PDF_ENGINE_MISSING_MESSAGE
    });
  });

  it("normalizes unsupported platforms and surfaces the expected message", async () => {
    probeCommandMock.mockImplementation(async (command) => {
      if (command === "pandoc") {
        return {
          available: true,
          output: "pandoc 3.7.0"
        };
      }

      if (command === "xelatex") {
        return {
          available: true,
          output: "XeTeX 3.141592653"
        };
      }

      if (command === "kpsewhich") {
        return {
          available: true,
          output: "/usr/local/texlive/texmf-dist/tex/xelatex/xecjk/xeCJK.sty"
        };
      }

      return {
        available: false,
        output: null
      };
    });

    const status = await new EnvironmentService("linux").getStatus();

    expect(status.platform).toBe("unsupported");
    expect(status.pdfEngineName).toBeNull();
    expect(status.pdfFontProfile).toBeNull();
    expect(status.issues).toContainEqual({
      code: "unsupported_platform",
      message: "This scaffold currently targets macOS and Windows."
    });
  });
});
