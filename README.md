# markdown-bridge

Local-first Electron desktop app for converting documents into and out of Markdown.

## Current Scope

This repository is an MVP scaffold. The currently supported conversion paths are:

- `DOCX -> MD`
- `MD -> DOCX`
- `MD -> PDF`

`PDF -> MD` is intentionally disabled in the current scaffold even though it remains an experimental product direction in the planning docs.

## Prerequisites

### Required

- `Node.js` 20 or later
- `npm`
- `Pandoc` installed and available on your system `PATH`

### Required Only For `MD -> PDF`

Install at least one PDF engine that Pandoc can use. The app currently probes for these commands on `PATH`:

- `weasyprint`
- `wkhtmltopdf`
- `pdflatex`
- `xelatex`
- `tectonic`

If none of them are installed, the app can still start, but `MD -> PDF` should be treated as unavailable.

### Platform Notes

- Supported target platforms are `macOS` and `Windows`
- Linux is not a supported product target for this scaffold
- `Pandoc` is not bundled with the app; install it separately before running real conversions

## Quick Start

Install dependencies from the repository root:

```bash
npm install
```

Optional but recommended: confirm external tools are visible on `PATH` before starting the app.

```bash
pandoc --version
wkhtmltopdf --version
```

The second command is only an example. If you use a different PDF engine from the supported probe list above, check that command instead.

## Run The App

Start the renderer, Electron main process, preload build, and Electron shell together:

```bash
npm run dev
```

Development runtime details:

- The renderer dev server runs on `http://localhost:5179`
- Electron waits for the renderer and compiled preload/main outputs before launching
- On startup, the app checks whether `pandoc` and a supported PDF engine are available

If the app starts with a setup warning banner, read it literally:

- `Pandoc was not found on PATH`: install Pandoc and restart the app
- `Markdown to PDF export needs a PDF engine...`: install one supported PDF engine if you need `MD -> PDF`

## Validation

Run validation commands from the repository root after `npm install`:

```bash
npm run typecheck
npm test
npm run lint
```

Current repository status as of 2026-03-18:

- `npm run typecheck` passes
- `npm test` passes
- `npm run lint` passes

## First Manual Run Checklist

Use this checklist if you want to confirm the scaffold is actually runnable, not just installed:

1. Run `npm install`
2. Verify `pandoc --version` works in the same shell
3. If you need PDF export, verify one supported PDF engine command works in the same shell
4. Run `npm run dev`
5. Confirm the app window opens and the environment banner reflects your installed tools
6. Select sample `.docx` or `.md` files and an output directory
7. Confirm `PDF -> MD` remains blocked in the current UI

## Known Gaps

- Drag-and-drop intake is planned in the PRD but not implemented in the current scaffold
- `PDF -> MD` is not enabled
- The repository validation story is incomplete until the Vitest and ESLint configuration issues are fixed
- Packaging and end-user installation flow are not documented yet

## Session Checklist

Start of session:

- Re-read the full tech spec, then summarize the session scope in one sentence
- Read `docs/tech-spec/markdown-bridge-implementation-plan.md` and confirm the target task scope
- Note the relevant spec sections for the task you are about to change
- Check the current code and validation status before editing
- Identify environment blockers before treating something as an open question

End of session:

- Update the relevant task checkbox and work record
- Record validation status, blocker notes, and the next task for handoff
- Finish only after the required verification is complete for the task scope

## Documentation

- [docs/README.md](./docs/README.md)
- [markdown-bridge PRD](./docs/prd/markdown-bridge-prd.md)
- [markdown-bridge tech spec draft](./docs/tech-spec/markdown-bridge-tech-spec-draft.md)
- [markdown-bridge implementation plan](./docs/tech-spec/markdown-bridge-implementation-plan.md)
