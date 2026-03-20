import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  blocksMatchingMarkdownState,
  ConversionForm,
  readCachedOutputDirectory,
  writeCachedOutputDirectory
} from "../../src/renderer/features/conversion/ConversionForm";

describe("ConversionForm", () => {
  it("describes PDF to MD as disabled in the scaffold", () => {
    const markup = renderToStaticMarkup(
      <ConversionForm
        selectedFiles={[]}
        onFilesChange={() => undefined}
        outputDirectory=""
        onOutputDirectoryChange={() => undefined}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("PDF -&gt; MD remains disabled in this scaffold.");
  });

  it("states that file picker only is in scope for MVP intake", () => {
    const markup = renderToStaticMarkup(
      <ConversionForm
        selectedFiles={[]}
        onFilesChange={() => undefined}
        outputDirectory=""
        onOutputDirectoryChange={() => undefined}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("MVP file intake uses the file picker only.");
    expect(markup).toContain("Drag-and-drop, drag-in folders, and file watching stay out of scope for now.");
  });

  it("keeps the submit action disabled when no files are selected", () => {
    const markup = renderToStaticMarkup(
      <ConversionForm
        selectedFiles={[]}
        onFilesChange={() => undefined}
        outputDirectory=""
        onOutputDirectoryChange={() => undefined}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("No files selected yet.");
    expect(markup).toContain("No output directory selected yet.");
    expect(markup).toContain("disabled=\"\"");
  });

  it("blocks PDF to MD submissions in the form", () => {
    const markup = renderToStaticMarkup(
      <ConversionForm
        selectedFiles={["/tmp/alpha.pdf"]}
        onFilesChange={() => undefined}
        outputDirectory="/tmp/out"
        onOutputDirectoryChange={() => undefined}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("PDF to MD submissions are blocked in this scaffold.");
    expect(markup).toContain("disabled=\"\"");
  });

  it("blocks Markdown to Markdown submissions in the form", () => {
    const markup = renderToStaticMarkup(
      <ConversionForm
        selectedFiles={["/tmp/alpha.md"]}
        onFilesChange={() => undefined}
        outputDirectory="/tmp/out"
        onOutputDirectoryChange={() => undefined}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("Selected files and target format cannot both be Markdown or both be non-Markdown.");
    expect(markup).toContain("disabled=\"\"");
  });

  it("renders the selected files list", () => {
    const markup = renderToStaticMarkup(
      <ConversionForm
        selectedFiles={["/tmp/alpha.md", "/tmp/beta.docx"]}
        onFilesChange={() => undefined}
        outputDirectory=""
        onOutputDirectoryChange={() => undefined}
        onSubmit={async () => undefined}
      />
    );

    expect(markup).toContain("2 file(s) queued for submission.");
    expect(markup).toContain("alpha.md");
    expect(markup).toContain("/tmp/alpha.md");
    expect(markup).toContain("beta.docx");
    expect(markup).toContain("/tmp/beta.docx");
  });

  it("reads the cached output directory from storage", () => {
    const storage = {
      getItem: vi.fn(() => "/tmp/out")
    };

    expect(readCachedOutputDirectory(storage)).toBe("/tmp/out");
  });

  it("writes the output directory to storage", () => {
    const storage = {
      removeItem: vi.fn(),
      setItem: vi.fn()
    };

    writeCachedOutputDirectory(storage, "/tmp/out");

    expect(storage.setItem).toHaveBeenCalledWith("markdown-bridge.output-directory", "/tmp/out");
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("clears the cached output directory when the value is empty", () => {
    const storage = {
      removeItem: vi.fn(),
      setItem: vi.fn()
    };

    writeCachedOutputDirectory(storage, "");

    expect(storage.removeItem).toHaveBeenCalledWith("markdown-bridge.output-directory");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("blocks when selected files and target format are both non-Markdown", () => {
    expect(blocksMatchingMarkdownState(["/tmp/alpha.docx"], "pdf")).toBe(true);
  });

  it("allows mixed file types because the selection is not uniformly Markdown or non-Markdown", () => {
    expect(blocksMatchingMarkdownState(["/tmp/alpha.md", "/tmp/beta.docx"], "pdf")).toBe(false);
  });
});
