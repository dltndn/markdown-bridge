# PDF to MD MVP Decision

Status: Accepted for MVP

## Context

The current repository already treats `PDF -> MD` as an experimental path only:

- `getConversionCapabilities()` keeps `experimentalPdfImport` set to `false`
- `supportedPaths` excludes `pdf->md`
- the renderer copy says `PDF -> MD` remains disabled in this scaffold

That means the app can describe the path, but it should not present it as a normal supported workflow in the MVP.

## Decision

Keep `PDF -> MD` out of the MVP release scope.

Retain gating and limitation messaging only. Do not add a normal conversion path, selector, or release claim for `PDF -> MD` until a non-fragile extraction flow has been validated and explicitly approved.

## Consequences

- The current gating tests and renderer copy remain the source of truth.
- The app avoids promising a path that has not been prototyped end to end.
- Any future enablement will need a separate decision and an integration test that proves the renderer and main-process capability data stay aligned.
