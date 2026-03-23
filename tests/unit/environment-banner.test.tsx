import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnvironmentBanner } from "../../src/renderer/features/environment/EnvironmentBanner";
import type { EnvironmentStatus } from "../../src/shared/contracts";
import { PDF_ENGINE_MISSING_MESSAGE } from "../../src/shared/messages";

function renderBanner(status: EnvironmentStatus | null): string {
  return renderToStaticMarkup(<EnvironmentBanner status={status} />);
}

describe("EnvironmentBanner", () => {
  it("shows the loading state before environment status is available", () => {
    const markup = renderBanner(null);

    expect(markup).toContain("Checking local conversion environment...");
  });

  it("shows the ready banner when there are no issues", () => {
    const markup = renderBanner({
      pandocAvailable: true,
      pandocVersion: "pandoc 3.7.0",
      pdfExportAvailable: true,
      pdfEngineName: "xelatex",
      pdfFontProfile: "Apple SD Gothic Neo",
      platform: "darwin",
      issues: []
    });

    expect(markup).toContain("Environment ready.");
    expect(markup).toContain("Pandoc pandoc 3.7.0 is available.");
    expect(markup).toContain("PDF export is configured via xelatex using Apple SD Gothic Neo.");
  });

  it("renders the exact issue messages for supported environment error categories", () => {
    const markup = renderBanner({
      pandocAvailable: false,
      pandocVersion: null,
      pdfExportAvailable: false,
      pdfEngineName: null,
      pdfFontProfile: null,
      platform: "unsupported",
      issues: [
        {
          code: "pandoc_not_found",
          message: "Pandoc was not found on PATH. Install Pandoc before creating conversion jobs."
        },
        {
          code: "pdf_engine_missing",
          message: PDF_ENGINE_MISSING_MESSAGE
        },
        {
          code: "unsupported_platform",
          message: "This scaffold currently targets macOS and Windows."
        }
      ]
    });

    expect(markup).toContain("Setup required.");
    expect(markup).toContain("Pandoc was not found on PATH. Install Pandoc before creating conversion jobs.");
    expect(markup).toContain(PDF_ENGINE_MISSING_MESSAGE);
    expect(markup).toContain("This scaffold currently targets macOS and Windows.");
  });
});
