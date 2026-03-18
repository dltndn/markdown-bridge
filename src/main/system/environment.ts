import type { EnvironmentIssue, EnvironmentStatus, PlatformName } from "../../shared/contracts";
import { PDF_ENGINE_MISSING_MESSAGE } from "../../shared/messages";
import { noopMainLogger, type MainLogger } from "../logging";
import { probeCommand } from "./command";

const PDF_ENGINES = ["weasyprint", "wkhtmltopdf", "pdflatex", "xelatex", "tectonic"];

export class EnvironmentService {
  constructor(
    private readonly runtimePlatform: NodeJS.Platform = process.platform,
    private readonly logger: MainLogger = noopMainLogger
  ) {}

  async getStatus(): Promise<EnvironmentStatus> {
    const platform = normalizePlatform(this.runtimePlatform);
    const issues: EnvironmentIssue[] = [];
    const pandocProbe = await probeCommand("pandoc");
    const pandocVersion = pandocProbe.output?.split("\n")[0] ?? null;
    const pdfEngineAvailable = await this.detectPdfEngine();

    if (!pandocProbe.available) {
      issues.push({
        code: "pandoc_not_found",
        message: "Pandoc was not found on PATH. Install Pandoc before creating conversion jobs."
      });
    }

    if (pandocProbe.available && !pdfEngineAvailable) {
      issues.push({
        code: "pdf_engine_missing",
        message: PDF_ENGINE_MISSING_MESSAGE
      });
    }

    if (platform !== "darwin" && platform !== "win32") {
      issues.push({
        code: "unsupported_platform",
        message: "This scaffold currently targets macOS and Windows."
      });
    }

    const status = {
      pandocAvailable: pandocProbe.available,
      pandocVersion,
      pdfExportAvailable: pandocProbe.available && pdfEngineAvailable,
      platform,
      issues
    };

    this.logger.info("environment:checked", {
      pandocAvailable: pandocProbe.available,
      pandocVersion,
      pdfExportAvailable: pandocProbe.available && pdfEngineAvailable,
      platform,
      issueCodes: issues.map((issue) => issue.code)
    });

    return status;
  }

  private async detectPdfEngine(): Promise<boolean> {
    for (const engine of PDF_ENGINES) {
      const result = await probeCommand(engine);
      if (result.available) {
        return true;
      }
    }

    return false;
  }
}

function normalizePlatform(platform: NodeJS.Platform): PlatformName {
  if (platform === "darwin" || platform === "win32") {
    return platform;
  }

  return "unsupported";
}
