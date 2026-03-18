# markdown-bridge

Local-first desktop document conversion app centered on Markdown.

## Development Setup

### Prerequisites

- `Node.js` 20 or later
- `npm`
- `Pandoc` installed on `PATH` for real document conversion
- A PDF engine available on the local system for `MD -> PDF`

### Install Dependencies

```bash
npm install
```

### Validation Commands

Run these commands from the repository root after `npm install`.
Before dependencies are installed, `npm test` fails with `sh: vitest: command not found` because the local `vitest` executable is not available until `node_modules` exists.

```bash
npm test
npm run typecheck
npm run lint
```

### Local Development

Start the Electron, preload, main, and renderer processes together.

```bash
npm run dev
```

The renderer is served by Vite on `http://localhost:5173`, and Electron waits for the renderer and compiled preload/main outputs before launching.

### Session Checklist

Start of session:

- Re-read the full tech spec, then summarize the session scope in one sentence.
- Read `docs/tech-spec/markdown-bridge-implementation-plan.md` and confirm the target task scope.
- Note the relevant spec sections for the task you are about to change.
- Check the current code and validation status, using `npm test`, `npm run typecheck`, and `npm run lint` when dependencies are installed.
- Identify any environment blockers before editing, and re-check the tech spec before treating something as an open question.

End of session:

- Update the relevant task checkbox and work record.
- Record the validation status, blocker notes, and the next task for handoff.
- Finish only after the required verification is complete for the task scope.

## Documentation

- [docs/README.md](./docs/README.md)
- [markdown-bridge implementation plan](./docs/tech-spec/markdown-bridge-implementation-plan.md)
