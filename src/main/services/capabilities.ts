import type { ConversionCapabilities } from "../../shared/contracts";

export function getConversionCapabilities(): ConversionCapabilities {
  return {
    supportedTargets: ["md", "docx", "pdf"],
    // If the renderer later drives its UI from supportedPaths instead of static copy,
    // add an integration test that verifies PDF->MD stays hidden end-to-end.
    experimentalPdfImport: false,
    supportedPaths: ["docx->md", "md->docx", "md->pdf"]
  };
}
