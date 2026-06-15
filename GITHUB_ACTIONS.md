# 🚀 自动化发布 - GitHub Actions

## ✅ 已配置

GitHub Actions 已配置完成！现在发布新版本只需 **2 个命令**。

---

## 📦 如何发布新版本

### 方法 1：推送 Tag（推荐）

```bash
# 1. 更新版本号
# 编辑 package.json，修改 "version": "0.3.1"

# 2. 提交更改
git add package.json
git commit -m "chore: bump version to 0.3.1"

# 3. 创建并推送 tag
git tag v0.3.1
git push origin main
git push origin v0.3.1
```

**GitHub Actions 会自动**：
- ✅ 安装依赖
- ✅ 运行测试（29 tests）
- ✅ 构建 Electron 应用
- ✅ 生成 SHA256 checksums
- ✅ 创建 GitHub Release
- ✅ 上传安装包和 checksums

### 方法 2：使用 npm version（更快）

```bash
# 自动更新 package.json + 创建 tag
npm version patch    # 0.3.0 → 0.3.1
# 或
npm version minor    # 0.3.0 → 0.4.0
# 或
npm version major    # 0.3.0 → 1.0.0

# 推送
git push origin main --follow-tags
```

---

## ⏱️ 预计时间

从推送 tag 到 Release 完成：**约 10-15 分钟**

- 安装依赖：2-3 分钟
- 运行测试：1 分钟
- 构建应用：5-8 分钟
- 创建 Release：1 分钟

---

## 📊 监控构建

### 查看进度
访问：https://github.com/58686/nova/actions

你会看到：
- 🟡 正在运行的 workflow（黄色圆圈）
- ✅ 成功的 workflow（绿色勾号）
- ❌ 失败的 workflow（红色叉号）

### 查看日志
点击 workflow → 点击 job → 查看每个步骤的输出

---

## 🎯 当前 v0.3.0 发布选项

由于 v0.3.0 tag 已经存在，你有两个选择：

### 选项 A：使用 GitHub Actions（推荐）

删除现有 tag，重新推送触发 CI：

```bash
# 删除本地和远程 tag
git tag -d v0.3.0
git push origin :refs/tags/v0.3.0

# 重新创建并推送（触发 GitHub Actions）
git tag v0.3.0
git push origin v0.3.0
```

GitHub Actions 会自动构建并发布。

### 选项 B：手动上传

等待本地构建完成，然后手动创建 Release（见 GITHUB_RELEASE_GUIDE.md）

---

## 🔍 Workflow 文件位置

```
.github/workflows/release.yml
```

### 主要配置

**触发条件**：
```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```

**运行环境**：
```yaml
runs-on: windows-latest
```

**Electron 镜像**：
```yaml
env:
  ELECTRON_MIRROR: https://npmmirror.com/mirrors/electron/
```

---

## ✨ 优势

### vs 手动发布
| 步骤 | 手动 | GitHub Actions |
|------|------|----------------|
| 构建 | 本地执行 | 云端执行 |
| 测试 | 手动运行 | 自动运行 |
| 上传 | 手动拖放 | 自动上传 |
| Checksums | 手动生成 | 自动生成 |
| 时间 | ~20 分钟 | ~15 分钟（无需守着）|
| 可重复性 | 依赖本地环境 | 完全一致 |

---

## 📝 Release Notes

Workflow 会自动使用 `RELEASE_NOTES_v0.3.0.md` 作为 Release 描述。

**下次发布前**：
1. 复制 `RELEASE_NOTES_v0.3.0.md` 为 `RELEASE_NOTES_v0.3.1.md`
2. 更新内容
3. 修改 workflow 中的 `body_path` 指向新文件

**或者**：使用动态模板（见进阶配置）

---

## 🚨 故障排查

### Workflow 失败了
1. 访问 https://github.com/58686/nova/actions
2. 点击失败的 workflow
3. 查看红色的步骤
4. 根据错误信息修复

### 常见错误

**测试失败**：
```
Error: Test suite failed to run
```
修复：在本地运行 `npm test` 确保通过

**构建失败**：
```
Error: Cannot find module 'electron'
```
修复：检查 `package.json` 依赖是否完整

**权限错误**：
```
Error: Resource not accessible by integration
```
修复：检查仓库设置 → Actions → Workflow permissions

---

## 🎓 进阶配置

### 支持多平台构建

```yaml
strategy:
  matrix:
    os: [windows-latest, macos-latest, ubuntu-latest]
runs-on: ${{ matrix.os }}
```

### 动态 Release Notes

```yaml
- name: Generate Release Notes
  run: |
    echo "# Nova ${{ github.ref_name }}" > release-notes.md
    git log $(git describe --tags --abbrev=0 HEAD^)..HEAD --pretty=format:"- %s" >> release-notes.md

- name: Create Release
  with:
    body_path: release-notes.md
```

### Draft Release（草稿）

```yaml
- name: Create Release
  with:
    draft: true  # 改为 true
```

发布会创建为草稿，你可以在 GitHub 上审查后手动发布。

---

## ✅ 完成清单

- [x] GitHub Actions workflow 已创建
- [x] 配置 Electron 镜像
- [x] 禁用代码签名
- [x] 自动生成 checksums
- [ ] 推送 tag 触发首次构建
- [ ] 验证 Release 成功

---

**现在发布新版本只需推送 tag，GitHub Actions 处理一切！** 🎉
