# Nova

Nova is an AI-assisted landing page generator with a built-in preview workspace. It combines brief-based generation, iteration, version history, AI provider configuration, and HTML export in one interface.

## Features

- Brief-driven page generation
- Live HTML preview with desktop, tablet, and mobile viewport modes
- Version history and restore flow
- Focus preview mode for reviewing generated pages
- AI provider configuration and connection testing
- HTML copy and export support
- Basic Electron shell and packaging configuration

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Electron

## Getting Started

Requirements:

- Node.js 18+
- npm

Install dependencies:

```bash
npm install
```

Start the web app in development:

```bash
npm run dev
```

Build the renderer app:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Type-check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Build Electron entry files:

```bash
npm run electron:dev
```

Package Electron app:

```bash
npm run electron:build
```

## Project Structure

```text
src/
  main/        Electron main and preload entry
  renderer/    React app, stores, services, and UI components
public/        Static assets
```

## Notes

- The repository includes Electron build and packaging setup, but there is currently no single npm script that launches the renderer dev server and Electron shell together.
- Generated pages are stored in browser local storage during local use.
- Exported HTML is intended to be directly previewable and portable.

## License

No license file has been added yet.
