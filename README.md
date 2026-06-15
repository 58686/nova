# Nova

Nova is an AI-powered multi-page UI generator built as an Electron desktop app. Describe what you want to build in plain language, and Nova generates complete, styled HTML pages — with live preview, version history, multi-page canvas, and cross-page navigation.

## Features

### AI Generation
- Brief-driven page generation with direction presets (landing page, dashboard, e-commerce, etc.)
- Conversational iteration — refine pages by chatting with the AI
- Auto multi-page creation: when you mention linking to a new page, Nova creates and generates it automatically
- Smart page type detection: standalone pages (login, register, 404) get independent layouts; app pages share nav and sidebar structure from existing pages
- Design consistency enforcement: new pages inherit the color palette, typography, and component patterns of existing pages
- Image-to-page generation (attach a reference screenshot)
- 12 AI providers supported: Anthropic, OpenAI, DeepSeek, Moonshot, Zhipu, QwenAI, OpenRouter, MiniMax, Baichuan, NVIDIA, and custom OpenAI-compatible endpoints

### Multi-page Workspace
- Per-project page management with named routes (e.g. `/dashboard`, `/login`)
- Browser-style tab bar with add/close controls and active page indicator
- In-page link navigation: clicking `<a>` tags in the preview switches pages instead of navigating away
- Page canvas: view all pages side-by-side as scaled device frames
- Canvas supports pan (drag or scroll), zoom (Ctrl+scroll or ±% buttons), and device frame switching (mobile / tablet / desktop)
- Click a canvas card to switch the active page

### Preview
- Live sandboxed iframe preview with desktop, tablet, and mobile viewport modes
- Focus preview mode — expands preview to full screen for detailed review
- Safe mode strips external scripts while preserving internal navigation

### Version History
- Every generation saves a version snapshot
- Restore or branch from any prior version

### Workspace
- Collapsible chat/workspace panel
- Sidebar with project list and quick switching
- Project selector dropdown in header

### Configuration & Export
- AI provider configuration panel with connection test
- Saved presets for quick provider switching
- **Encrypted API key storage** using OS-level encryption (Electron safeStorage)
- HTML copy and export (via Electron file dialog)
- Data storage settings (localStorage-backed, no backend required)

### Developer Features
- **Undo/Redo system** (Ctrl+Z / Ctrl+Y) for reversible actions
- **Structured logging** with file rotation and 7-day retention
- **Unit tests** (29 tests with Vitest) covering core utilities and AI services
- TypeScript strict mode with comprehensive type safety

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + CSS custom properties |
| State | Zustand |
| Desktop shell | Electron 42.4.0 |
| Testing | Vitest + @testing-library/react |
| AI abstraction | Custom `RuntimeAIService` (streaming, 12 providers) |
| Security | OS-level encryption (safeStorage), SSRF protection |
| Persistence | localStorage (no server required) |

## Getting Started

**Requirements:** Node.js 18+, npm

```bash
# Install dependencies
npm install

# Start renderer dev server only (port 5173)
npm run dev

# Build Electron main/preload and launch full desktop app
npm run electron:dev

# TypeScript check
npm run typecheck

# Lint
npm run lint

# Run unit tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui

# Production renderer build
npm run build

# Package desktop installer (outputs to release/)
npm run electron:build
```

> **VS Code note:** If Electron behaves like plain Node.js (broken APIs), it's because VS Code sets `ELECTRON_RUN_AS_NODE=1`. The `electron:dev` script uses `scripts/electron-launcher.js` to strip this env var automatically. Never run `electron .` directly from the VS Code terminal.

## Project Structure

```
src/
  main/
    index.ts          Electron main process — file I/O, HTTP proxy, IPC handlers
    preload.ts        contextBridge API exposed to renderer as window.electronAPI
    secureStorage.ts  API key encryption using Electron safeStorage
    logger.ts         Structured logging with file rotation
  renderer/
    components/       UI components (ChatPanel, PreviewPanel, CanvasView, Header, …)
    stores/           Zustand stores (appStore, aiConfigStore, settingsStore)
    services/         AI provider abstraction, logging, command history, secure storage
    hooks/            useLocale, useKeyboard
    locale/           zh-CN / en-US string selection
  test/
    setup.ts          Vitest test configuration and mocks
scripts/
  electron-launcher.js  Strips ELECTRON_RUN_AS_NODE before spawning Electron
public/               Static assets
```

## Key Architecture Notes

- All data persists to `localStorage` — there is no backend or database.
- The renderer is a standard React SPA; in dev it loads from `http://localhost:5173`, in production from `dist/index.html`.
- IPC channels between main and renderer: `save-file`, `load-file`, `export-html`, `proxy-request`.
- AI streaming uses `for await` over the provider's async iterator; abort is handled via `AbortController`.
- In-page navigation is intercepted by an injected script inside each iframe that sends `postMessage({ type: 'nova-navigate', href })` to the parent window.

## Localization

UI supports Chinese (zh-CN) and English (en-US). Language is stored in `localStorage` under `nova-locale` and toggled from the header.

## License

MIT License - see [LICENSE](LICENSE) file for details.
