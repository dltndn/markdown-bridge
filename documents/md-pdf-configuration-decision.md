# MD to PDF Configuration Decision

Status: Accepted

## Context

The current app already treats `MD -> PDF` as a supported path and detects a small set of local PDF engines in `EnvironmentService`:

- `weasyprint`
- `wkhtmltopdf`
- `pdflatex`
- `xelatex`
- `tectonic`

The main process does not bundle any of these tools. It only reports whether at least one usable PDF engine is present and surfaces a single `pdf_engine_missing` message when none are found.

## Decision

Use `Pandoc` as the conversion driver and keep the runtime engine-agnostic.

For repository guidance, recommend `Tectonic` first when users need a concrete PDF engine to install for `MD -> PDF`, because it avoids the extra package-management burden associated with a larger TeX setup. If `Tectonic` is already present, any other engine on the detected list is also acceptable.

Do not hardcode a single PDF engine in application logic for the MVP. The app should continue to treat `MD -> PDF` as available whenever `Pandoc` plus at least one supported local engine are present.

## Consequences

- The app stays aligned with the current detection-only behavior in `EnvironmentService`.
- User guidance can name supported engines without forcing a single runtime preference.
- Future prototype work can compare output quality and setup friction before any engine preference is encoded in code.
