import { describe, expect, it } from "vitest";
import { getConversionCapabilities } from "../../src/main/services/capabilities";

describe("getConversionCapabilities", () => {
  it("keeps PDF to MD out of the supported path list", () => {
    const capabilities = getConversionCapabilities();

    expect(capabilities.experimentalPdfImport).toBe(false);
    expect(capabilities.supportedPaths).toEqual(["docx->md", "md->docx", "md->pdf"]);
    expect(capabilities.supportedPaths).not.toContain("pdf->md");
  });
});
