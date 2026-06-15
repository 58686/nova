# Changelog

All notable changes to Nova will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-06-16

### Added

#### Security & Compliance
- **API Key Encryption**: Implemented OS-level encryption for API keys using Electron `safeStorage`
  - Automatic migration of existing plain-text keys on app startup
  - Graceful fallback to plain text if encryption unavailable
  - IPC handlers: `encrypt-string`, `decrypt-string`, `is-encryption-available`
- **MIT License**: Added LICENSE file for open-source distribution

#### Testing Infrastructure
- **Vitest Unit Testing**: Set up comprehensive unit testing framework
  - 29 passing tests covering core utilities and AI services
  - Test coverage for `htmlUtils` (HTML parsing, blank shell detection)
  - Test coverage for `runtimeAI` (API calls, error handling, SSRF protection)
  - Mock setup for Electron APIs and localStorage
  - NPM scripts: `test`, `test:ui`, `test:run`, `test:coverage`

#### Developer Experience
- **Undo/Redo System**: Command pattern implementation for reversible actions
  - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+Shift+Z (redo)
  - Commands: DeletePage, UpdateProjectName, DeleteProject
  - 50-command history with stack management
  - Active outside text inputs/textareas only
- **Structured Logging**: Production-ready logging system
  - Separate loggers for renderer and main process
  - File output with automatic rotation (10MB limit)
  - 7-day log retention with auto-cleanup
  - Named loggers: `aiLogger`, `storageLogger`, `ipcLogger`, `uiLogger`
  - Logs stored in: `app.getPath('userData')/logs/YYYY-MM-DD.log`

#### Dependencies
- **Electron 42.4.0**: Upgraded from 33.4.11 (9 major versions)
  - Security vulnerability fixes
  - Improved `safeStorage` API stability
  - Removed 49 obsolete transitive dependencies

### Fixed

#### Critical Bugs (27 total bug fixes)
- Fixed JSON.parse errors with proper error handling and validation
- Resolved race conditions in AI streaming responses
- Fixed XSS vulnerabilities in HTML preview rendering
- Prevented SSRF attacks with localhost/private IP blocking
- Fixed multiple type safety issues with proper TypeScript guards
- Improved error handling across IPC channels
- Fixed file I/O error handling with proper validation

#### Type Safety
- Updated TypeScript lib to ES2022 for `.at()` array method support
- Replaced `any` types with proper `unknown` + type guards
- Added comprehensive type definitions for Electron APIs

### Changed

- Updated all AI-related console.log calls to use structured `aiLogger`
- Improved keyboard shortcut documentation
- Enhanced test setup with better Electron API mocking

### Technical Improvements

- **Code Quality**: 27 bug fixes across critical, high, medium, and low priorities
- **Security**: OS-level encryption, SSRF protection, XSS prevention
- **Maintainability**: Unit tests, structured logging, type safety
- **Stability**: Electron 42.4.0, improved error handling

## [0.2.6] - Previous Release

Initial public release with core features:
- Multi-page UI generation
- 12 AI provider support
- Canvas view with device frames
- Version history
- Project management
- Live preview with viewport switching

---

[0.3.0]: https://github.com/58686/nova/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/58686/nova/releases/tag/v0.2.6
