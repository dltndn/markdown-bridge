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

## Documentation

- [docs/README.md](./docs/README.md)
- [markdown-bridge implementation plan](./docs/tech-spec/markdown-bridge-implementation-plan.md)
