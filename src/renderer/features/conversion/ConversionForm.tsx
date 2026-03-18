import { useMemo, useState } from "react";
import type { CollisionPolicy, ConversionFormat, ConversionRequest } from "../../../shared/contracts";
import type { Dispatch, SetStateAction } from "react";

type ConversionFormProps = {
  selectedFiles: string[];
  onFilesChange: Dispatch<SetStateAction<string[]>>;
  outputDirectory: string;
  onOutputDirectoryChange: Dispatch<SetStateAction<string>>;
  onSubmit: (request: ConversionRequest) => Promise<void>;
};

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
  const supportedHint = useMemo(
    // This hint is static today. If the form becomes capability-driven, cover the
    // IPC-to-renderer wiring with a test instead of relying on copy-only regressions.
    () => "Core paths: DOCX -> MD, MD -> DOCX, MD -> PDF. PDF -> MD remains disabled in this scaffold.",
    []
  );

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
    if (selectedFiles.length === 0 || !outputDirectory) {
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

      <button type="button" className="button-primary" disabled={submitting || selectedFiles.length === 0 || !outputDirectory} onClick={handleSubmit}>
        {submitting ? "Creating job..." : "Start conversion"}
      </button>
    </div>
  );
}
