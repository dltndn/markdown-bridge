import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConversionForm } from "../../src/renderer/features/conversion/ConversionForm";

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
});
