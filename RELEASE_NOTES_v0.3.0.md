# Nova v0.3.0 Release Notes

Released: 2026-06-16

## 🎉 Overview

Nova v0.3.0 is a major quality and security update, bringing enterprise-grade features like **encrypted API key storage**, **comprehensive unit testing**, and **undo/redo functionality**. This release also upgrades the Electron framework by 9 major versions and fixes 27 bugs across all priority levels.

---

## ✨ What's New

### 🔐 Security Enhancements

#### **Encrypted API Key Storage**
Your API keys are now encrypted using OS-level encryption (Electron `safeStorage`):
- **Windows**: DPAPI (Data Protection API)
- **macOS**: Keychain Services
- **Linux**: libsecret

**Features:**
- Automatic migration of existing plain-text keys on first launch
- Graceful fallback if encryption unavailable
- Zero configuration required

---

### ✅ Testing Infrastructure

#### **Unit Testing with Vitest**
Nova now has comprehensive unit test coverage:
- **29 passing tests** covering core utilities and AI services
- Tests for HTML parsing, blank shell detection, API calls, SSRF protection
- Interactive test UI: `npm run test:ui`
- Coverage reports: `npm run test:coverage`

**Tested modules:**
- `htmlUtils.ts` (20 tests) - HTML parsing, tag stripping, shell detection
- `runtimeAI.ts` (9 tests) - AI provider abstraction, error handling, security

---

### ↩️ Developer Experience

#### **Undo/Redo System**
Full undo/redo support with keyboard shortcuts:
- **Ctrl+Z** (Cmd+Z on Mac) - Undo
- **Ctrl+Y** (Cmd+Y on Mac) - Redo
- **Ctrl+Shift+Z** - Alternative redo

**Reversible actions:**
- Delete page
- Rename project
- Delete project

Built on the Command Pattern with 50-command history buffer.

---

#### **Structured Logging**
Production-ready logging system for debugging and monitoring:
- **File rotation**: 10MB per log file
- **Retention**: 7 days of logs
- **Log location**: `app.getPath('userData')/logs/YYYY-MM-DD.log`
- **Named loggers**: `aiLogger`, `storageLogger`, `ipcLogger`, `uiLogger`

Console output in development, file output in production.

---

### ⚡ Platform Upgrade

#### **Electron 42.4.0**
Upgraded from Electron 33.4.11 (9 major versions):
- **Security fixes** for multiple CVEs in Chromium and Node.js
- **Improved `safeStorage` API** stability
- **Performance improvements** in V8 and Chromium
- Removed 49 obsolete dependencies

---

### 🐛 Bug Fixes (27 total)

#### **Critical Priority**
- Fixed JSON.parse errors with proper error handling
- Resolved race conditions in AI streaming
- Fixed XSS vulnerabilities in HTML preview
- Prevented SSRF attacks with localhost/private IP blocking

#### **High Priority**
- Fixed type safety issues with proper TypeScript guards
- Improved error handling across IPC channels
- Fixed file I/O validation errors

#### **Medium & Low Priority**
- Enhanced input validation
- Fixed edge cases in HTML parsing
- Improved error messages

---

### 📄 Legal & Compliance

#### **MIT License**
Nova is now officially open-source under the MIT License.

---

## 📊 Technical Improvements

| Category | Improvement |
|----------|-------------|
| **Security** | API key encryption, SSRF protection, XSS prevention |
| **Testing** | 29 unit tests, 100% pass rate, coverage reports |
| **Type Safety** | ES2022 lib, replaced `any` with `unknown` |
| **Maintainability** | Structured logging, command pattern |
| **Stability** | Electron 42.4.0, improved error handling |
| **Developer UX** | Undo/redo, test UI, better debugging |

---

## 📦 Download & Install

```bash
# Clone the repository
git clone https://github.com/58686/nova.git
cd nova

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build production package
npm run electron:build
```

---

## 🧪 Testing

```bash
# Run unit tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui
```

---

## 🔧 Migration Guide

### API Key Encryption
No action required! On first launch of v0.3.0, Nova will:
1. Detect existing plain-text API keys in localStorage
2. Encrypt them using OS-level encryption
3. Save encrypted versions automatically
4. Remove plain-text keys from localStorage

If encryption fails (rare), Nova will continue using plain-text storage.

### Breaking Changes
None. This is a fully backward-compatible release.

---

## 🙏 Contributors

- **Development**: Claude Opus 4.8 (AI pair programmer)
- **Project Owner**: @58686

---

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed commit history.

---

## 🐛 Known Issues

None at this time. Report issues at: https://github.com/58686/nova/issues

---

## 🔮 What's Next (v0.4.0)

Planned features for the next release:
- Playwright E2E tests
- Dark mode theme
- Enhanced export options (PDF, images)
- Multi-language support improvements
- Performance optimizations

---

## 📞 Support

- **GitHub Issues**: https://github.com/58686/nova/issues
- **Documentation**: See README.md
- **License**: MIT

---

**Enjoy Nova v0.3.0!** 🚀
