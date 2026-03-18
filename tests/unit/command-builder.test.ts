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
    expect(buildPandocArgs("input.md", "output.pdf", "md", "pdf")).toEqual([
      "input.md",
      "-f",
      "markdown",
      "-o",
      "output.pdf"
    ]);
  });

  it("keeps the output flag as the trailing pair for supported paths", () => {
    const cases = [
      ["input.docx", "output.md", "docx", "md"],
      ["input.md", "output.docx", "md", "docx"],
      ["input.md", "output.pdf", "md", "pdf"]
    ] as const;

    for (const [inputPath, outputPath, inputFormat, targetFormat] of cases) {
      const args = buildPandocArgs(inputPath, outputPath, inputFormat, targetFormat);
      expect(args.slice(-2)).toEqual(["-o", outputPath]);
    }
  });

  it("throws for unsupported paths", () => {
    expect(() => buildPandocArgs("input.pdf", "output.docx", "pdf", "docx")).toThrow(
      "Unsupported conversion path: pdf -> docx"
    );
  });
});
