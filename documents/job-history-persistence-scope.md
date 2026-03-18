# Job History Persistence Scope

Status: Accepted

## Context

The current application already keeps conversion jobs in memory for the active session. There is no persisted job-store implementation, and the existing milestone work has focused on live queue behavior, per-item status updates, and UI reporting rather than recovery across app restarts.

## Decision

Keep job history in memory for the MVP and limit visibility to the current app session.

Do not add disk persistence, database storage, or cross-launch history recovery in the first release.

## Consequences

- The implementation stays aligned with the current `JobStore` behavior.
- Restarting the app clears prior job state, which is acceptable for the MVP.
- If persistence becomes necessary later, it should be introduced as a separate decision with explicit retention and privacy rules.
