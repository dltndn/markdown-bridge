# Logging Safety Standard

This note defines the minimum logging safety rule for the main process:
log summaries and machine-readable status only. Do not log any user-authored document body or raw text.

## Allowed Log Content

- Event names
- Timestamps
- Job IDs and item IDs
- Counts, formats, platform values, and normalized error codes
- Boolean availability flags

## Disallowed Fields

Do not pass any of the following field names, or equivalent raw document text, into the logger:

- `body`
- `content`
- `documentBody`
- `documentContent`
- `markdown`
- `rawContent`
- `rawText`
- `extractedText`

## Rule Of Thumb

If a value could contain user-written prose, extracted document text, or a full Markdown source body, reduce it to a summary before logging. Prefer counts, IDs, and error codes over raw payloads.
