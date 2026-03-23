import type { ConversionFormat } from "../../shared/contracts";

export function buildPandocArgs(
  inputPath: string,
  outputPath: string,
  inputFormat: ConversionFormat,
  targetFormat: ConversionFormat,
  pdfEngineName?: string | null,
  pdfFontProfile?: string | null
): string[] {
  if (inputFormat === "docx" && targetFormat === "md") {
    return [inputPath, "-f", "docx", "-t", "markdown", "-o", outputPath];
  }

  if (inputFormat === "md" && targetFormat === "docx") {
    return [inputPath, "-f", "markdown", "-t", "docx", "-o", outputPath];
  }

  if (inputFormat === "md" && targetFormat === "pdf") {
    if (!pdfEngineName) {
      throw new Error("PDF engine is required for Markdown to PDF conversion.");
    }
    if (!pdfFontProfile) {
      throw new Error("PDF font profile is required for Markdown to PDF conversion.");
    }

    return [
      inputPath,
      "-f",
      "markdown",
      `--pdf-engine=${pdfEngineName}`,
      "-V",
      `mainfont=${pdfFontProfile}`,
      "-V",
      `CJKmainfont=${pdfFontProfile}`,
      "-o",
      outputPath
    ];
  }

  throw new Error(`Unsupported conversion path: ${inputFormat} -> ${targetFormat}`);
}
