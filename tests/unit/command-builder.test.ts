import { describe, expect, it } from "vitest";
import { buildPandocArgs } from "../../src/main/services/command-builder";

describe("buildPandocArgs", () => {
  it("builds DOCX to Markdown arguments", () => {
    expect(buildPandocArgs("input.docx", "output.md", "docx", "md")).toEqual([
      "input.docx",
      "-f",
      "docx",
      "-t",
      "markdown",
      "-o",
      "output.md"
    ]);
  });

  it("builds Markdown to DOCX arguments", () => {
    expect(buildPandocArgs("input.md", "output.docx", "md", "docx")).toEqual([
      "input.md",
      "-f",
      "markdown",
      "-t",
      "docx",
      "-o",
      "output.docx"
    ]);
  });

  it("builds Markdown to PDF arguments", () => {
    expect(buildPandocArgs("input.md", "output.pdf", "md", "pdf", "xelatex", "Apple SD Gothic Neo")).toEqual([
      "input.md",
      "-f",
      "markdown",
      "--pdf-engine=xelatex",
      "-V",
      "mainfont=Apple SD Gothic Neo",
      "-V",
      "CJKmainfont=Apple SD Gothic Neo",
      "-o",
      "output.pdf"
    ]);
  });

  it("keeps the output flag as the trailing pair for supported paths", () => {
    const cases = [
      ["input.docx", "output.md", "docx", "md"],
      ["input.md", "output.docx", "md", "docx"],
      ["input.md", "output.pdf", "md", "pdf", "xelatex", "Apple SD Gothic Neo"]
    ] as const;

    for (const [inputPath, outputPath, inputFormat, targetFormat, pdfEngineName, pdfFontProfile] of cases) {
      const args = buildPandocArgs(inputPath, outputPath, inputFormat, targetFormat, pdfEngineName, pdfFontProfile);
      expect(args.slice(-2)).toEqual(["-o", outputPath]);
    }
  });

  it("requires a PDF engine for Markdown to PDF arguments", () => {
    expect(() => buildPandocArgs("input.md", "output.pdf", "md", "pdf")).toThrow(
      "PDF engine is required for Markdown to PDF conversion."
    );
  });

  it("requires a PDF font profile for Markdown to PDF arguments", () => {
    expect(() => buildPandocArgs("input.md", "output.pdf", "md", "pdf", "xelatex")).toThrow(
      "PDF font profile is required for Markdown to PDF conversion."
    );
  });

  it("throws for unsupported paths", () => {
    expect(() => buildPandocArgs("input.pdf", "output.docx", "pdf", "docx")).toThrow(
      "Unsupported conversion path: pdf -> docx"
    );
  });
});
