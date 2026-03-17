import type { ConversionFormat } from "../../shared/contracts";

export function buildPandocArgs(inputPath: string, outputPath: string, inputFormat: ConversionFormat, targetFormat: ConversionFormat): string[] {
  if (inputFormat === "docx" && targetFormat === "md") {
    return [inputPath, "-f", "docx", "-t", "markdown", "-o", outputPath];
  }

  if (inputFormat === "md" && targetFormat === "docx") {
    return [inputPath, "-f", "markdown", "-t", "docx", "-o", outputPath];
  }

  if (inputFormat === "md" && targetFormat === "pdf") {
    return [inputPath, "-f", "markdown", "-o", outputPath];
  }

  throw new Error(`Unsupported conversion path: ${inputFormat} -> ${targetFormat}`);
}

