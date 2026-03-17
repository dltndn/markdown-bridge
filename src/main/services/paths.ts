import fs from "node:fs/promises";
import path from "node:path";
import type { CollisionPolicy, ConversionFormat } from "../../shared/contracts";

const EXTENSION_FORMAT_MAP: Record<string, ConversionFormat> = {
  ".md": "md",
  ".docx": "docx",
  ".pdf": "pdf"
};

export function getFormatFromPath(filePath: string): ConversionFormat | null {
  return EXTENSION_FORMAT_MAP[path.extname(filePath).toLowerCase()] ?? null;
}

export function isSupportedConversionPath(inputFormat: ConversionFormat, targetFormat: ConversionFormat): boolean {
  return (
    (inputFormat === "docx" && targetFormat === "md") ||
    (inputFormat === "md" && targetFormat === "docx") ||
    (inputFormat === "md" && targetFormat === "pdf")
  );
}

export async function ensureDirectoryExists(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function resolveOutputPath(
  inputPath: string,
  outputDirectory: string,
  targetFormat: ConversionFormat,
  collisionPolicy: CollisionPolicy
): Promise<{ outputPath: string | null; skipped: boolean }> {
  const parsed = path.parse(inputPath);
  const ext = `.${targetFormat}`;
  const initialPath = path.join(outputDirectory, `${parsed.name}${ext}`);

  try {
    await fs.access(initialPath);
  } catch {
    return { outputPath: initialPath, skipped: false };
  }

  if (collisionPolicy === "skip") {
    return { outputPath: null, skipped: true };
  }

  if (collisionPolicy === "overwrite") {
    return { outputPath: initialPath, skipped: false };
  }

  for (let index = 1; index <= 9999; index += 1) {
    const candidatePath = path.join(outputDirectory, `${parsed.name}-${index}${ext}`);
    try {
      await fs.access(candidatePath);
    } catch {
      return { outputPath: candidatePath, skipped: false };
    }
  }

  throw new Error("Unable to allocate a unique output path.");
}

