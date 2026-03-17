import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getFormatFromPath, isSupportedConversionPath, resolveOutputPath } from "../../src/main/services/paths";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("paths helpers", () => {
  it("detects supported formats", () => {
    expect(getFormatFromPath("/tmp/file.docx")).toBe("docx");
    expect(getFormatFromPath("/tmp/file.txt")).toBeNull();
  });

  it("recognizes supported conversion paths", () => {
    expect(isSupportedConversionPath("docx", "md")).toBe(true);
    expect(isSupportedConversionPath("pdf", "docx")).toBe(false);
  });

  it("renames output when collision policy is rename", async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-bridge-"));
    createdDirectories.push(tempDirectory);
    await fs.writeFile(path.join(tempDirectory, "sample.md"), "existing");

    const result = await resolveOutputPath("/tmp/sample.docx", tempDirectory, "md", "rename");
    expect(result.outputPath).toBe(path.join(tempDirectory, "sample-1.md"));
    expect(result.skipped).toBe(false);
  });
});

