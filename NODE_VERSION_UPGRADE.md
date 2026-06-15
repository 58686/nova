# Node.js 版本升级说明

## 问题

GitHub Actions 构建失败，因为某些依赖需要 Node.js 20+：

```
whatwg-url@16.0.1 requires: node '^20.19.0 || ^22.12.0 || >=24.0.0'
current: node v18.20.8
```

## 解决方案

### 1. 升级 GitHub Actions 的 Node.js 版本

`.github/workflows/release.yml`:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # 从 18 升级到 20
```

### 2. 重新生成 package-lock.json

```bash
rm -rf node_modules package-lock.json
npm install
```

这确保 lockfile 与所有依赖版本完全同步。

## 本地开发

如果你本地使用 Node.js 18，建议升级到 Node.js 20：

### Windows
下载并安装：https://nodejs.org/en/download/

### 使用 nvm（推荐）
```bash
nvm install 20
nvm use 20
```

### 验证版本
```bash
node --version  # 应该显示 v20.x.x
npm --version   # 应该显示 10.x.x
```

## 兼容性

Node.js 20 是 LTS 版本（Long Term Support），支持到 2026 年 4 月。

**优势**：
- ✅ 更好的性能
- ✅ 更新的 V8 引擎
- ✅ 支持最新的依赖包
- ✅ 安全更新

**Nova 应用兼容性**：
- ✅ Electron 42.4.0 完全支持
- ✅ 所有依赖都兼容
- ✅ 测试全部通过

## 如果必须使用 Node.js 18

可以降级 `whatwg-url` 包：

```json
"resolutions": {
  "whatwg-url": "^14.0.0"
}
```

但**不推荐**，因为会错过安全更新。

---

**推荐：升级到 Node.js 20** ✅
