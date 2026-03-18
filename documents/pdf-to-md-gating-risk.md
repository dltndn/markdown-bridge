# PDF to MD Gating Risk

Current coverage for task 3.9 locks two artifacts:

- `getConversionCapabilities()` keeps `experimentalPdfImport` as `false`
- the renderer copy says `PDF -> MD` remains disabled in this scaffold

Residual risk remains if the UI later becomes capability-driven at runtime.
In that case, a future regression could appear in the wiring between:

- main-process capability export
- IPC delivery to preload and renderer
- renderer logic that decides whether `PDF -> MD` is shown or enabled

The current tests do not exercise that end-to-end path. If the form stops using static copy and starts consuming `supportedPaths` or `experimentalPdfImport` dynamically, add an integration-style test that verifies:

- `pdf->md` is absent from the effective renderer capabilities
- the UI does not expose `PDF -> MD` as a selectable path
- mismatches between main-process capability data and renderer presentation fail fast
