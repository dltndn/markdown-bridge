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
});
