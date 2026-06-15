# Nova v0.3.0 - Security, Testing, and Developer Experience

**Released:** 2026-06-16

## 🎉 Highlights

This major update brings enterprise-grade security, comprehensive testing, and powerful developer tools to Nova.

### 🔐 **API Key Encryption**
Your API keys are now protected with OS-level encryption (Windows DPAPI, macOS Keychain, Linux libsecret). Existing keys are automatically migrated on first launch.

### ✅ **Unit Testing Framework**
29 passing tests covering core utilities and AI services. Run `npm test` to see them in action.

### ↩️ **Undo/Redo System**
Full keyboard shortcut support (Ctrl+Z/Y) for reversible actions like page deletion and project renaming.

### 📝 **Structured Logging**
Production-ready logging with automatic file rotation and 7-day retention. Logs stored in `userData/logs/`.

### ⚡ **Electron 42.4.0**
Upgraded 9 major versions from 33.4.11, bringing security fixes and performance improvements.

### 🐛 **27 Bug Fixes**
Critical fixes for JSON parsing, race conditions, XSS, and SSRF vulnerabilities.

---

## 📦 Downloads

### Windows
- **Nova-Setup-0.3.0.exe** - Installer (recommended)
- **Nova-0.3.0-win.zip** - Portable version

### Installation
1. Download the installer
2. Run `Nova-Setup-0.3.0.exe`
3. Launch Nova from Start Menu
4. Configure your AI provider API key (will be encrypted automatically)

---

## 🆕 What's New

### Features
- ✅ API key encryption with safeStorage
- ✅ Undo/Redo (Ctrl+Z/Y)
- ✅ Structured logging with rotation
- ✅ Unit testing framework (29 tests)
- ✅ MIT License

### Improvements
- ⚡ Electron 42.4.0 (9 major versions upgrade)
- 🔒 Enhanced security (SSRF protection, XSS prevention)
- 📘 TypeScript ES2022 lib support
- 🧹 27 bug fixes across all priorities

---

## 📖 Documentation

- **Full Changelog**: [CHANGELOG.md](https://github.com/58686/nova/blob/main/CHANGELOG.md)
- **Detailed Release Notes**: [RELEASE_NOTES_v0.3.0.md](https://github.com/58686/nova/blob/main/RELEASE_NOTES_v0.3.0.md)
- **README**: [README.md](https://github.com/58686/nova/blob/main/README.md)

---

## 🔧 For Developers

```bash
# Clone and install
git clone https://github.com/58686/nova.git
cd nova
npm install

# Run tests
npm test

# Start development
npm run electron:dev

# Build
npm run electron:build
```

---

## 🙏 Acknowledgments

Built with Claude Opus 4.8 as AI pair programmer.

---

## 🐛 Report Issues

Found a bug? [Open an issue](https://github.com/58686/nova/issues)

---

## 📝 License

MIT License - see [LICENSE](https://github.com/58686/nova/blob/main/LICENSE)

---

**Checksums** (will be added after build completes)
