# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 5173, renderer only)
npm run electron:dev # Build Electron main/preload and launch full desktop app
npm run build        # TypeScript check + Vite production build
npm run electron:build # Package Electron app (outputs to release/)
npm run lint         # ESLint (src only, max-warnings: 0)
npm run typecheck    # TypeScript type check without emitting
npm run test:run     # Run Vitest test suite once (29 tests across runtimeAI, commands, etc.)
npm run test         # Run Vitest in watch mode
npm run test:coverage # Run tests with coverage report
```

Tests use Vitest with @testing-library/react. Test files live alongside source as `*.test.ts(x)`.

## Known System Issue: ELECTRON_RUN_AS_NODE

When running from VS Code terminal, `ELECTRON_RUN_AS_NODE=1` is inherited from VS Code's extension host process. This makes Electron behave as plain Node.js, breaking `require('electron')` and all Electron APIs.

**Fix**: The `electron:dev` script uses `scripts/electron-launcher.js` which removes this env var before spawning the Electron process. Never run `electron .` directly from the VS Code terminal; always go through the npm script or the launcher.

## Architecture

Nova is an Electron desktop app for AI-driven landing page generation. Users describe a page concept via a brief form; an AI provider generates HTML; the result is shown in a live sandboxed iframe preview with version history and export.

### Process Split

**Electron main** ([src/main/index.ts](src/main/index.ts)) handles file I/O and HTTP proxying via IPC. It exposes a `contextBridge` API ([src/main/preload.ts](src/main/preload.ts)) to the renderer under `window.electronAPI`. IPC channels: `save-file`, `load-file`, `export-html`, `proxy-request`.

**Renderer** ([src/renderer/](src/renderer/)) is a standard React 18 + Vite SPA. In dev mode it loads from `http://localhost:5173`; in production from `dist/index.html`.

### State

Two Zustand stores drive all application state:

- **`useAppStore`** ([src/renderer/store/appStore.ts](src/renderer/store/appStore.ts)) — project/version lifecycle, current brief (product, audience, goal, sections, directionId), generation state (`isGenerating`, `abortController`), generated HTML, per-project message history, and UI toggles (sidebar, settings, preview focus).
- **`useAIConfigStore`** ([src/renderer/store/aiConfigStore.ts](src/renderer/store/aiConfigStore.ts)) — selected provider, API key, baseUrl, model, temperature/maxTokens, saved presets, and test results.

All data persists to `localStorage` — there is no backend.

### AI Service Layer

`RuntimeAIService` ([src/renderer/services/runtimeAI.ts](src/renderer/services/runtimeAI.ts)) abstracts 12 providers:
- **Anthropic** — uses the Messages API directly
- **OpenAI-compatible** — used for OpenAI, DeepSeek, NVIDIA, MiniMax, Baichuan, Moonshot, QwenAI, and custom endpoints
- **OpenRouter** — its own proxy format
- **Zhipu** — diverges from the OpenAI shape

Provider presets and defaults live in [src/renderer/services/ai.ts](src/renderer/services/ai.ts).

### Key Component Responsibilities

| Component | Role |
|-----------|------|
| `App.tsx` | Layout controller, wires stores to panels |
| `ChatPanel` | Brief form input + message history display |
| `PreviewPanel` | Sandboxed iframe + desktop/tablet/mobile viewport switching |
| `VersionHistory` | Restore or branch from prior generated versions |
| `AIConfigManager` | Provider/model/key configuration UI |
| `APITester` | Lightweight connection test for current config |

### Build Outputs

| Directory | Contents |
|-----------|----------|
| `dist/` | Vite renderer build (loaded by Electron in prod) |
| `dist-electron/` | Compiled Electron main + preload JS |
| `release/` | Packaged installers (NSIS + portable, Windows) |

### Localization

UI strings are selected via `pickLocale` based on `localStorage` key `nova-locale` (`zh-CN` / `en-US`). Both Chinese and English inline comments appear throughout the codebase.
