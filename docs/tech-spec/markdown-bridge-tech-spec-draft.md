# Markdown Bridge Tech Spec Draft

## Document Information

- Product Name: `markdown-bridge`
- Document Type: Technical Specification
- Status: Draft
- Last Updated: 2026-03-17
- Related PRD: [`../prd/markdown-bridge-prd.md`](../prd/markdown-bridge-prd.md)

## 1. Purpose

This document defines the initial technical design for `markdown-bridge`, a local-first desktop application that converts documents between `Markdown`, `DOCX`, and `PDF` with `Markdown` as the center of all supported workflows.

The goal of this draft is to establish a practical implementation baseline for the first build of the product. It is not a final implementation contract and may be refined after prototyping and validation.

## 2. Product Constraints

- All document processing must happen locally.
- The application must support `macOS` and `Windows`.
- The application must be built with `Node.js` and `TypeScript`.
- The user interface must be web-based.
- `Pandoc` will not be bundled and must be installed separately by the user.
- PDF export may depend on an additional PDF engine installed on the user system.
- Non-Markdown document-to-document conversion is out of scope by design.

## 3. Supported Conversion Model

The application supports only conversion paths where `Markdown` is either the source or the destination.

### Core Supported Paths

- `DOCX -> MD`
- `MD -> DOCX`
- `MD -> PDF`

### Experimental Path

- `PDF -> MD` as best effort, behind capability checks and limitation messaging

### Unsupported Paths

- `DOCX -> PDF`
- `PDF -> DOCX`
- Any future conversion path that does not include `Markdown`

## 4. Architecture Overview

The application will use a desktop-shell-plus-web-frontend architecture.

### Core Stack

- Desktop shell: `Electron`
- Frontend: `React` + `TypeScript`
- Build tooling: `Vite`
- Local dev server port: `5179` instead of Vite's default port, to reduce collisions with users already running other local Vite apps
- Main process runtime: `Node.js`
- Primary conversion engine: external `Pandoc` CLI
- Experimental PDF extraction adapter: separate adapter interface if `PDF -> MD` remains in scope after prototyping

### High-Level Design

- The renderer process provides the GUI, job setup, progress UI, and result reporting.
- The Electron main process owns privileged operations such as filesystem access, process spawning, and environment checks.
- A preload layer exposes a narrow API from the main process to the renderer.
- A conversion service selects the correct conversion adapter, orchestrates execution, and returns structured events.
- A job queue manages multi-file conversion without blocking the UI.

## 5. Proposed Repository Structure

```text
markdown-bridge/
  docs/
    prd/
    tech-spec/
  src/
    main/
      app/
      ipc/
      services/
      system/
    preload/
    renderer/
      app/
      components/
      features/
      hooks/
      styles/
      types/
  scripts/
  assets/
  tests/
    unit/
    integration/
```

### Directory Responsibilities

- `src/main/`: Electron main process code
- `src/preload/`: secure bridge between renderer and main process
- `src/renderer/`: React application
- `src/main/services/`: conversion, queueing, and filesystem-related application services
- `src/main/ipc/`: IPC registration and request handlers
- `src/main/system/`: environment checks, platform detection, and command discovery
- `tests/unit/`: pure logic tests
- `tests/integration/`: IPC and conversion service tests with mocked or real process boundaries as needed

## 6. Process Model

### 6.1 Electron Main Process Responsibilities

- App lifecycle management
- `Pandoc` availability detection
- PDF export dependency detection
- Filesystem dialogs and output path handling
- Process spawning for conversion jobs
- Job queue execution
- Logging and error normalization
- IPC endpoint registration

### 6.2 Renderer Responsibilities

- File intake UI
- Conversion settings UI
- Job list and progress display
- Error presentation
- Output navigation actions

### 6.3 Preload Responsibilities

- Expose a typed API to the renderer
- Prevent direct unrestricted Node access from the renderer
- Convert IPC request-response and event patterns into a stable UI-facing client

## 7. Security Model

The app is local-first, but Electron still requires explicit hardening.

### Required Security Decisions

- `contextIsolation` must be enabled
- `nodeIntegration` must be disabled in the renderer
- The preload script must expose only a minimal, typed API
- Renderer-originated file paths must be validated in the main process
- Shell execution must use direct process spawning without shell interpolation where possible

### Privacy Requirements

- No document content may be uploaded externally
- No telemetry should be enabled in the MVP unless explicitly added later with clear consent
- Logs must avoid storing full document contents

## 8. User Flow to System Flow Mapping

### Flow 1: App Startup

1. Electron launches the main process.
2. Main process performs environment checks.
3. Main process resolves whether `Pandoc` is available on `PATH`.
4. Main process detects whether required PDF export dependencies are available for `MD -> PDF`.
5. Renderer receives environment status and updates the onboarding banner or blocking state.

### Flow 2: User Creates a Conversion Job

1. User selects files through drag-and-drop or file picker.
2. Renderer validates obvious file-level conditions.
3. Renderer sends job creation request to the main process.
4. Main process normalizes file paths, output options, and conversion targets.
5. Main process inserts items into the conversion queue.

### Flow 3: Conversion Execution

1. Queue service dequeues a file task.
2. Conversion service resolves the adapter for the selected path.
3. The selected adapter validates required dependencies and builds its execution plan.
4. Main process spawns the required external process or marks the job unsupported for the current environment.
5. Status events are emitted back to the renderer.
6. Success or failure is recorded per item.
7. Queue continues until the batch is complete.

## 9. Conversion Engine Design

### 9.1 Adapter Strategy

The application should use a small adapter layer so each conversion path has an explicit execution strategy.

For MVP, `Pandoc` remains the primary adapter and should be invoked as an external binary using `child_process.spawn`.

This approach is preferred over shell-based execution because it:

- avoids quoting issues across platforms
- reduces command injection risk
- provides structured access to `stdout`, `stderr`, and exit codes

### Binary Resolution

The application should resolve `Pandoc` in this order:

1. User-configured path if a future advanced setting exists
2. System `PATH`

For the initial build, system `PATH` lookup is sufficient if paired with clear installation guidance.

### Adapter Interface Expectations

Each adapter should be responsible for:

- declaring which conversion paths it supports
- validating required external dependencies before execution
- building platform-safe argument arrays
- normalizing raw process failures into application error codes

This prevents the queue and UI layers from assuming every path is a `Pandoc` command.

### 9.2 Conversion Rules

#### `DOCX -> MD`

Base command pattern:

```bash
pandoc input.docx -f docx -t markdown -o output.md
```

#### `MD -> DOCX`

Base command pattern:

```bash
pandoc input.md -f markdown -t docx -o output.docx
```

#### `MD -> PDF`

Base command pattern:

```bash
pandoc input.md -f markdown -o output.pdf
```

The exact PDF export path depends on an available PDF engine and platform setup. The app must detect this capability during startup and before job creation, then surface clear setup guidance when the required engine is missing.

#### `PDF -> MD`

This path should not be modeled as a normal `Pandoc` conversion rule. PDF import quality depends on the source document structure, and the extraction path may require a separate adapter or be disabled entirely in MVP until prototype validation is complete.

### 9.3 Command Builder

A dedicated command builder should be responsible for:

- validating supported source-target combinations
- generating platform-safe argument arrays
- resolving output filenames
- injecting optional future conversion flags

This keeps UI-level decisions separate from execution details for adapters that execute CLI commands.

## 10. Job Queue Design

The application needs a queue because users may select many files in one action.

### Queue Requirements

- Track each file as an independent job item
- Support batch submission
- Limit concurrent conversions to a small configurable number
- Continue processing after a single-file failure
- Emit structured progress events
- Support a non-terminal validation failure before execution begins

### Proposed Initial Concurrency

- Default concurrency: `1`

This is conservative and simplifies debugging, error handling, and predictable filesystem behavior for MVP. Controlled concurrency can be increased later after validation.

### Job States

- `queued`
- `validating`
- `processing`
- `success`
- `failed`
- `skipped`
- `cancelled` if cancellation is implemented later

## 11. Error Handling Strategy

Errors should be normalized into application-level categories.

### Error Categories

- `pandoc_not_found`
- `pdf_engine_missing`
- `unsupported_format`
- `unsupported_conversion_path`
- `experimental_path_unavailable`
- `input_not_found`
- `output_write_failed`
- `conversion_failed`
- `invalid_configuration`

### Error Handling Requirements

- Preserve raw process details for debugging
- Show simplified user-facing messages in the UI
- Keep job-level failures isolated from batch-level control flow

## 12. IPC Design

IPC should be typed and intentionally small.

### Proposed IPC Surface

- `app:getEnvironmentStatus`
- `dialog:pickFiles`
- `dialog:pickOutputDirectory`
- `conversion:getCapabilities`
- `conversion:createJob`
- `conversion:getJob`
- `conversion:listJobs`
- `conversion:subscribe`

### Event Payload Principles

- Stable shape
- Explicit status enums
- No raw unbounded object blobs
- Paths and timestamps included where useful

## 13. Data Model Draft

### 13.1 Environment Status

```ts
type EnvironmentStatus = {
  pandocAvailable: boolean;
  pandocVersion: string | null;
  pdfExportAvailable: boolean;
  platform: "darwin" | "win32" | "unsupported";
  issues: EnvironmentIssue[];
};
```

### 13.2 Conversion Request

```ts
type ConversionFormat = "md" | "docx" | "pdf";

type ConversionRequest = {
  inputPaths: string[];
  targetFormat: ConversionFormat;
  outputDirectory: string;
  collisionPolicy: "skip" | "overwrite" | "rename";
};
```

### 13.3 Job Item

```ts
type JobItemStatus =
  | "queued"
  | "validating"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

type JobItem = {
  id: string;
  inputPath: string;
  inputFormat: ConversionFormat;
  outputPath: string | null;
  targetFormat: ConversionFormat;
  status: JobItemStatus;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### 13.4 Batch Job

```ts
type ConversionJob = {
  id: string;
  items: JobItem[];
  summary: {
    total: number;
    queued: number;
    processing: number;
    success: number;
    failed: number;
    skipped: number;
  };
};
```

## 14. Filesystem Behavior

### Input Rules

- Input files must exist before a job starts
- Unsupported extensions must be rejected before execution

### Output Rules

- The output directory must exist or be creatable
- Output file names should preserve the source base name where possible
- File name collisions must follow the selected policy

### Collision Policy Semantics

- `skip`: do not write the file and mark the item `skipped`
- `overwrite`: replace the existing output file
- `rename`: generate a unique suffixed filename

For MVP, `rename` is the safest default.

## 15. UI Surface Draft

### Primary Screens

- Main conversion screen
- Job progress and results panel
- Environment issue banner or setup state

### Main Conversion Screen Sections

- File intake zone
- Selected files list
- Output format selector
- Output directory selector
- Collision handling selector
- Convert action

### Results Panel Sections

- Batch summary
- Per-file status list
- Error details for failed items
- Open output folder action

## 16. Logging and Diagnostics

The app should support basic structured logging in the main process.

### Logging Targets

- Console in development
- File-based logs can be added later if needed

### What to Log

- App startup status
- `Pandoc` detection results
- Job creation and completion
- Process exit codes
- Normalized error categories
- Summary metadata only: counts, IDs, formats, status values, and normalized error codes

### What Not to Log

- Full document contents
- Sensitive user document text
- Markdown source bodies, extracted plain text, and any field named `body`, `content`, `documentBody`, `documentContent`, `markdown`, `rawContent`, `rawText`, or `extractedText`

If a log payload might contain user-authored text, reduce it to a summary before calling the logger.

## 17. Testing Strategy

### Unit Tests

- format validation
- command builder behavior
- output path generation
- collision policy logic
- error normalization

### Integration Tests

- IPC request/response flow
- queue behavior across success and failure
- environment detection logic
- process execution boundary with mocked `Pandoc`

### Manual Validation

- `macOS` end-to-end conversion checks
- `Windows` end-to-end conversion checks
- startup behavior with and without `Pandoc` installed
- `MD -> PDF` behavior with and without a usable PDF engine available
- batch handling with mixed valid and invalid files
- `PDF -> MD` gating behavior when the experimental path is unavailable

## 18. Initial Implementation Plan

### Phase 1: Project Scaffold

- Create Electron + React + TypeScript application structure
- Set up build tooling and linting
- Establish typed IPC foundation

### Phase 2: Environment and Filesystem

- Implement `Pandoc` detection
- Implement file picker and output directory selection
- Implement path and extension validation

### Phase 3: Conversion Core

- Implement command builder
- Implement process execution service
- Implement queue manager
- Implement status events

### Phase 4: UI

- Build intake form
- Build progress view
- Build error and environment messaging

### Phase 5: Verification

- Add unit and integration tests
- Perform manual cross-platform validation
- Document setup and limitations

## 19. Open Technical Questions

- What is the most reliable `MD -> PDF` configuration across `macOS` and `Windows` without excessive setup burden?
- Should `PDF -> MD` ship in MVP as an experimental gated feature, or move out of MVP until a non-fragile extraction path is validated?
- Should completed job history exist only in memory for MVP, or should it persist for the current app session?
- Should file watching or drag-in folders be considered later, or remain out of scope entirely?

## 20. Recommended Next Documents

- Architecture Decision Record for choosing `Electron`
- `Pandoc` integration and licensing note
- UX wireframe document
- MVP implementation plan with milestone breakdown
