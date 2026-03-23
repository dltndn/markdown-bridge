import type { EnvironmentIssue, EnvironmentStatus, PlatformName } from "../../shared/contracts";
import { PDF_ENGINE_MISSING_MESSAGE } from "../../shared/messages";
import { noopMainLogger, type MainLogger } from "../logging";
import { probeCommand } from "./command";

const PDF_ENGINE = "xelatex" as const;
const REQUIRED_CJK_PACKAGE = "xeCJK.sty" as const;
const PDF_FONT_PROFILES: Record<Extract<PlatformName, "darwin" | "win32">, string> = {
  darwin: "Apple SD Gothic Neo",
  win32: "Malgun Gothic"
};

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
    const pdfEngineName = await this.detectPdfEngine(platform);
    const pdfFontProfile = resolvePdfFontProfile(platform);
    const pdfExportAvailable = pandocProbe.available && pdfEngineName !== null && pdfFontProfile !== null;

    if (!pandocProbe.available) {
      issues.push({
        code: "pandoc_not_found",
        message: "Pandoc was not found on PATH. Install Pandoc before creating conversion jobs."
      });
    }

    if (pandocProbe.available && !pdfExportAvailable) {
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
      pdfExportAvailable,
      pdfEngineName,
      pdfFontProfile,
      platform,
      issues
    };

    this.logger.info("environment:checked", {
      pandocAvailable: pandocProbe.available,
      pandocVersion,
      pdfExportAvailable,
      pdfEngineName,
      pdfFontProfile,
      platform,
      issueCodes: issues.map((issue) => issue.code)
    });

    return status;
  }

  private async detectPdfEngine(platform: PlatformName): Promise<string | null> {
    if (platform !== "darwin" && platform !== "win32") {
      return null;
    }

    const engineResult = await probeCommand(PDF_ENGINE);
    if (!engineResult.available) {
      return null;
    }

    const packageResult = await probeCommand("kpsewhich", [REQUIRED_CJK_PACKAGE]);
    return packageResult.available ? PDF_ENGINE : null;
  }
}

function normalizePlatform(platform: NodeJS.Platform): PlatformName {
  if (platform === "darwin" || platform === "win32") {
    return platform;
  }

  return "unsupported";
}

function resolvePdfFontProfile(platform: PlatformName): string | null {
  if (platform === "darwin" || platform === "win32") {
    return PDF_FONT_PROFILES[platform];
  }

  return null;
}
