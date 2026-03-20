import { useEffect, useMemo, useState } from "react";
import type { CollisionPolicy, ConversionFormat, ConversionRequest } from "../../../shared/contracts";
import type { Dispatch, SetStateAction } from "react";

const OUTPUT_DIRECTORY_STORAGE_KEY = "markdown-bridge.output-directory";

type ConversionFormProps = {
  selectedFiles: string[];
  onFilesChange: Dispatch<SetStateAction<string[]>>;
  outputDirectory: string;
  onOutputDirectoryChange: Dispatch<SetStateAction<string>>;
  onSubmit: (request: ConversionRequest) => Promise<void>;
};

function blocksPdfToMarkdown(selectedFiles: string[], targetFormat: ConversionFormat): boolean {
  return targetFormat === "md" && selectedFiles.some((filePath) => filePath.toLowerCase().endsWith(".pdf"));
}

function isMarkdownFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(".md");
}

export function blocksMatchingMarkdownState(selectedFiles: string[], targetFormat: ConversionFormat): boolean {
  if (selectedFiles.length === 0) {
    return false;
  }

  const allFilesAreMarkdown = selectedFiles.every(isMarkdownFile);
  const allFilesAreNonMarkdown = selectedFiles.every((filePath) => !isMarkdownFile(filePath));
  const targetIsMarkdown = targetFormat === "md";

  return (allFilesAreMarkdown && targetIsMarkdown) || (allFilesAreNonMarkdown && !targetIsMarkdown);
}

export function readCachedOutputDirectory(storage: Pick<Storage, "getItem">): string {
  return storage.getItem(OUTPUT_DIRECTORY_STORAGE_KEY) ?? "";
}

export function writeCachedOutputDirectory(storage: Pick<Storage, "removeItem" | "setItem">, outputDirectory: string): void {
  if (outputDirectory) {
    storage.setItem(OUTPUT_DIRECTORY_STORAGE_KEY, outputDirectory);
    return;
  }

  storage.removeItem(OUTPUT_DIRECTORY_STORAGE_KEY);
}

export function ConversionForm({
  selectedFiles,
  onFilesChange,
  outputDirectory,
  onOutputDirectoryChange,
  onSubmit
}: ConversionFormProps) {
  const [targetFormat, setTargetFormat] = useState<ConversionFormat>("md");
  const [collisionPolicy, setCollisionPolicy] = useState<CollisionPolicy>("rename");
  const [submitting, setSubmitting] = useState(false);
  const blockedByUnsupportedCombination = blocksPdfToMarkdown(selectedFiles, targetFormat);
  const blockedByMatchingMarkdownState = blocksMatchingMarkdownState(selectedFiles, targetFormat);
  const supportedHint = useMemo(
    // This hint is static today. If the form becomes capability-driven, cover the
    // IPC-to-renderer wiring with a test instead of relying on copy-only regressions.
    () => "Core paths: DOCX -> MD, MD -> DOCX, MD -> PDF. PDF -> MD remains disabled in this scaffold.",
    []
  );
  const scopeHint = "MVP file intake uses the file picker only. Drag-and-drop, drag-in folders, and file watching stay out of scope for now.";

  useEffect(() => {
    if (typeof window === "undefined" || outputDirectory) {
      return;
    }

    try {
      const cachedDirectory = readCachedOutputDirectory(window.localStorage);

      if (cachedDirectory) {
        onOutputDirectoryChange(cachedDirectory);
      }
    } catch {
      // Ignore local persistence failures so the form still works in restricted runtimes.
    }
  }, [onOutputDirectoryChange, outputDirectory]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      writeCachedOutputDirectory(window.localStorage, outputDirectory);
    } catch {
      // Ignore local persistence failures so the form still works in restricted runtimes.
    }
  }, [outputDirectory]);

  const handlePickFiles = async () => {
    const paths = await window.markdownBridge.pickFiles();
    if (paths.length > 0) {
      onFilesChange(paths);
    }
  };

  const handlePickOutputDirectory = async () => {
    const directory = await window.markdownBridge.pickOutputDirectory();
    if (directory) {
      onOutputDirectoryChange(directory);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || !outputDirectory || blockedByUnsupportedCombination || blockedByMatchingMarkdownState) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        inputPaths: selectedFiles,
        targetFormat,
        outputDirectory,
        collisionPolicy
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="conversion-form">
      <p className="muted">{supportedHint}</p>
      <p className="muted">{scopeHint}</p>
      <div className="button-row">
        <button type="button" onClick={handlePickFiles}>
          Select files
        </button>
        <button type="button" className="button-secondary" onClick={handlePickOutputDirectory}>
          Select output folder
        </button>
      </div>

      <div className="field-grid">
        <label>
          <span>Target format</span>
          <select value={targetFormat} onChange={(event) => setTargetFormat(event.target.value as ConversionFormat)}>
            <option value="md">Markdown</option>
            <option value="docx">DOCX</option>
            <option value="pdf">PDF</option>
          </select>
        </label>

        <label>
          <span>Collision policy</span>
          <select value={collisionPolicy} onChange={(event) => setCollisionPolicy(event.target.value as CollisionPolicy)}>
            <option value="rename">Rename</option>
            <option value="skip">Skip</option>
            <option value="overwrite">Overwrite</option>
          </select>
        </label>
      </div>

      <div className="selection-panel">
        <div>
          <h3>Selected files</h3>
          {selectedFiles.length === 0 ? (
            <p>No files selected yet.</p>
          ) : (
            <>
              <p>{selectedFiles.length} file(s) queued for submission.</p>
              <ul className="selected-files-list">
                {selectedFiles.map((filePath) => {
                  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;

                  return (
                    <li key={filePath}>
                      <strong>{fileName}</strong>
                      <span>{filePath}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        <div>
          <h3>Output directory</h3>
          <p>{outputDirectory || "No output directory selected yet."}</p>
        </div>
      </div>

      {blockedByUnsupportedCombination ? (
        <p className="muted form-warning">PDF to MD submissions are blocked in this scaffold.</p>
      ) : null}

      {blockedByMatchingMarkdownState ? (
        <p className="muted form-warning">
          Selected files and target format cannot both be Markdown or both be non-Markdown.
        </p>
      ) : null}

      <button
        type="button"
        className="button-primary"
        disabled={
          submitting ||
          selectedFiles.length === 0 ||
          !outputDirectory ||
          blockedByUnsupportedCombination ||
          blockedByMatchingMarkdownState
        }
        onClick={handleSubmit}
      >
        {submitting ? "Creating job..." : "Start conversion"}
      </button>
    </div>
  );
}
