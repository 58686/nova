#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const electronPath = require('electron');
const args = process.argv.slice(2);

// Remove ELECTRON_RUN_AS_NODE so Electron initializes as a proper desktop app.
// VS Code sets this env var to '1' for its extension host; inherited child processes break.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
env.NODE_ENV = env.NODE_ENV || 'development';

function waitForDevServer(port) {
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        req.destroy();
        resolve();
      });
      req.on('error', () => setTimeout(check, 500));
      req.setTimeout(400, () => {
        req.destroy();
        setTimeout(check, 500);
      });
    };
    check();
  });
}

async function main() {
  if (env.NODE_ENV === 'development') {
    process.stdout.write('[electron-launcher] Waiting for Vite dev server on port 5173...\n');
    await waitForDevServer(5173);
    process.stdout.write('[electron-launcher] Dev server ready. Launching Electron.\n');
  }

  const proc = spawn(electronPath, [path.join(__dirname, '..'), ...args], {
    stdio: 'inherit',
    env,
  });

  proc.on('close', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[electron-launcher] Fatal:', err);
  process.exit(1);
});
