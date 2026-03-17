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

  it("throws for unsupported paths", () => {
    expect(() => buildPandocArgs("input.pdf", "output.docx", "pdf", "docx")).toThrow(
      "Unsupported conversion path: pdf -> docx"
    );
  });
});

