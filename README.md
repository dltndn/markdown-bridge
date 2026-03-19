# markdown-bridge

Local-first Electron desktop app for converting documents into and out of Markdown.

## What This Project Is

`markdown-bridge` is a desktop document conversion tool for people who want Markdown to be the center of their document workflow.

- Convert documents locally instead of uploading them to a web converter
- Move documents into Markdown for AI-assisted editing or analysis
- Export Markdown back to shareable formats such as `DOCX` and `PDF`
- Process multiple files in one batch and review per-file results

This project is open source and currently implemented as an MVP scaffold built with Electron, React, TypeScript, and Pandoc.

## Privacy Model

- All conversion work happens on your machine
- The app does not upload document contents to external services as part of normal use
- `Pandoc` and any PDF engine are local dependencies that must already exist on your system

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
- `pdflatex`
- `xelatex`
- `tectonic`

If none of them are installed, the app can still start, but `MD -> PDF` should be treated as unavailable.

### Platform Notes

- Supported target platforms are `macOS` and `Windows`
- Linux is not a supported product target for this scaffold
- `Pandoc` is not bundled with the app; install it separately before running real conversions

### Install External Tools

Install the external tools before starting the app.

#### macOS

Recommended path:

1. Open `Terminal`
2. Install Pandoc with Homebrew:

```bash
brew install pandoc
```

3. Verify that Pandoc is available:

```bash
pandoc --version
```

4. If you need `MD -> PDF`, install one supported PDF engine. The simplest Homebrew option is:

```bash
brew install tectonic
```

5. Verify the PDF engine:

```bash
tectonic --version
```

Alternative PDF engine for macOS:

```bash
brew install --cask basictex
eval "$(/usr/libexec/path_helper)"
pdflatex --version
```

Why this README does not recommend `brew install --cask wkhtmltopdf`:

- As of 2026-03-19, Homebrew no longer provides a `wkhtmltopdf` cask, so that command fails with `No Cask with this name exists`
- For this repository, `tectonic` or `basictex` is a more reliable macOS path because the app already detects `tectonic`, `pdflatex`, and `xelatex`

Alternative Pandoc install paths:

- Download the official macOS installer from the Pandoc install page and run the package installer if you do not want to use Homebrew
- If you prefer MacPorts, the official Pandoc docs also list `port install pandoc`

#### Windows

Recommended path:

1. Open `PowerShell`
2. Install Pandoc with `winget`:

```powershell
winget install --source winget --exact --id JohnMacFarlane.Pandoc
```

3. Close and reopen `PowerShell`
4. Verify that Pandoc is available:

```powershell
pandoc --version
```

5. If you need `MD -> PDF`, install one supported PDF engine. One common option is:

```powershell
winget install wkhtmltopdf
```

6. Close and reopen `PowerShell`, then verify:

```powershell
wkhtmltopdf --version
```

Alternative paths:

- Use the official Pandoc Windows installer from the Pandoc install page if you prefer a GUI installer
- If you already use Chocolatey, the official Pandoc docs also list `choco install pandoc`

Use the official installer or package manager flow you normally trust for your platform. The important requirement for this repository is simple: the commands must be callable from the same shell where you run `npm run dev`.

Official reference:

- Pandoc install guide: [pandoc.org/installing.html](https://pandoc.org/installing.html)

## Quick Start

Install dependencies from the repository root:

```bash
npm install
```

Optional but recommended: confirm external tools are visible on `PATH` before starting the app.

```bash
pandoc --version
tectonic --version
```

The second command is only an example. If you use `basictex`, `weasyprint`, or another supported engine from the probe list above, check that command instead.

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

## How To Use The App

After the app window opens:

1. Click `Select files`
2. Choose one or more `.docx` or `.md` files
3. Click `Select output folder`
4. Choose the target format: `Markdown`, `DOCX`, or `PDF`
5. Choose the collision policy:
   `Rename` keeps existing files and writes a suffixed output name
   `Skip` leaves existing output files untouched
   `Overwrite` replaces existing output files
6. Click `Start conversion`
7. Review per-file status in the `Job Results` panel
8. Use `Open output folder` after successful conversion if you want to inspect the results in Finder or Explorer

### First Conversion Example

If you only want to prove the app works end-to-end, use this flow:

1. Prepare a simple `example.md` file
2. Start the app with `npm run dev`
3. Select `example.md`
4. Choose an empty output folder
5. Set target format to `DOCX`
6. Leave collision policy as `Rename`
7. Start the conversion and confirm a `.docx` file appears in the output folder

### What The UI Will Tell You

- The environment banner reports whether `Pandoc` and PDF export support are available
- The create form blocks `PDF -> MD` in the current scaffold
- The results panel shows job totals and per-file states such as `queued`, `processing`, `success`, `failed`, and `skipped`

## Validation

Run validation commands from the repository root after `npm install`:

```bash
npm run typecheck
npm test
npm run lint
```

Current repository status as of 2026-03-19:

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
- Packaging and end-user installation flow are not documented yet
- This README explains developer setup for the repository, not packaged-app installation

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
