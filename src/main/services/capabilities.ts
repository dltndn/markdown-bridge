import type { ConversionCapabilities } from "../../shared/contracts";

export function getConversionCapabilities(): ConversionCapabilities {
  return {
    supportedTargets: ["md", "docx", "pdf"],
    experimentalPdfImport: false,
    supportedPaths: ["docx->md", "md->docx", "md->pdf"]
  };
}

