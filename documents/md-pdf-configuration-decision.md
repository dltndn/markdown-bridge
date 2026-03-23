# MD to PDF Configuration Decision

Status: Accepted

## Context

The current app already treats `MD -> PDF` as a supported path, but Korean PDF output requires a deterministic engine and font strategy across macOS and Windows.

The main process does not bundle TeX tooling. It must detect whether `xelatex` is installed, then pair that engine with a platform font profile for Korean output.

## Decision

Use `Pandoc` as the conversion driver and standardize Korean PDF export on `xelatex`.

Use platform-default Korean fonts with `xelatex`:

- macOS: `Apple SD Gothic Neo`
- Windows: `Malgun Gothic`

Do not treat `tectonic`, `pdflatex`, `weasyprint`, or `wkhtmltopdf` as sufficient for supported Korean PDF export in the app. If `xelatex` is missing, the app should mark `MD -> PDF` as unavailable and instruct the user to install a TeX distribution that provides it.

## Consequences

- The app trades engine flexibility for reliable Korean PDF rendering on macOS and Windows.
- User guidance must clearly state that Korean PDF export requires `xelatex`.
- Future work can revisit broader engine support only if it preserves cross-platform Korean output quality.
