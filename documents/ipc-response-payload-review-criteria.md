# IPC Response Payload Review Criteria

This note defines the review rules for response payloads on the current IPC surface in `src/main/ipc/register.ts`.

Current response channels and payload types:

- `app:getEnvironmentStatus` returns `EnvironmentStatus`
- `conversion:getCapabilities` returns `ConversionCapabilities`
- `conversion:createJob` returns `ConversionJob`
- `conversion:getJob` returns `ConversionJob | null`
- `conversion:listJobs` returns `ConversionJob[]`
- `conversion:subscribe` emits `JobUpdateEvent`

## Review Rules

- Return only values defined in `src/shared/contracts.ts`.
- Do not pass Electron objects, `Error` objects, `BrowserWindow`, file handles, or raw process objects across IPC.
- Keep payloads item-oriented and bounded. Prefer `JobItem[]`, `EnvironmentIssue[]`, and `issues[]` over nested free-form blobs.
- Treat `errorMessage` as user-facing text only. If raw failure text must be preserved, keep it in `JobItem.errorDetails` and keep the string short enough to be safe for logging and UI transport.
- Keep `EnvironmentStatus.issues[].message` human-readable. Do not include stack traces, stderr dumps, or command transcripts.
- Keep `JobUpdateEvent` small. It should carry one `ConversionJob` snapshot and the optional `itemId`, not the whole application state.
- Preserve explicit status and error enums. If a new status or error field is needed, add a clear consumer and an upper bound for the data it can carry.

## Review Checklist

Before adding or expanding any IPC response field, confirm the following:

- The field exists in `src/shared/contracts.ts`.
- The field has a bounded shape and a clear consumer.
- The field does not duplicate data already available in a smaller typed field.
- The field does not introduce raw nested payloads or unbounded arrays.
- The same shape is still safe to serialize and display through preload and renderer.
