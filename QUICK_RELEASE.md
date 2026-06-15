# 快速发布指南 - Nova v0.3.0

## 🚀 当前状态

✅ 所有代码完成  
✅ 所有测试通过（29/29）  
✅ 所有文档完成  
✅ Git 提交完成（9 commits）  
✅ Git Tag 创建（v0.3.0）  
⏳ 构建中（已禁用代码签名，使用镜像）

---

## 📦 等待构建完成

构建完成后会有通知。然后执行：

```powershell
# 检查产物
ls D:\work\opencode-project\nova\release\
```

应该看到：
- `Nova-Setup-0.3.0.exe` - 安装器
- `Nova-0.3.0-win.zip` - 便携版

---

## 🌐 网络恢复后 3 步发布

### 步骤 1：推送代码（1 分钟）
```powershell
cd D:\work\opencode-project\nova
git push origin main
git push origin v0.3.0
```

### 步骤 2：生成 Checksums（1 分钟）
```powershell
Get-FileHash release\Nova-Setup-0.3.0.exe -Algorithm SHA256
Get-FileHash release\Nova-0.3.0-win.zip -Algorithm SHA256
```

### 步骤 3：GitHub Release（3 分钟）
1. 访问：https://github.com/58686/nova/releases/new
2. 选择 tag：`v0.3.0`
3. 标题：`Nova v0.3.0 - Security, Testing, and Developer Experience`
4. 描述：复制 `GITHUB_RELEASE_v0.3.0.md`
5. 上传：`Nova-Setup-0.3.0.exe` 和 `Nova-0.3.0-win.zip`
6. 追加 checksums 到描述末尾
7. 点击 **Publish release**

---

## 📝 所有文档位置

- `FINAL_CHECKLIST.md` - 完整清单
- `SESSION_SUMMARY.md` - 会话总结
- `GITHUB_RELEASE_v0.3.0.md` - Release 模板
- `RELEASE_NOTES_v0.3.0.md` - 发布说明
- `CHANGELOG.md` - 变更日志

---

## 🎯 v0.3.0 亮点

- 🔐 API Key 加密（OS-level）
- ✅ 29 单元测试（Vitest）
- ↩️ Undo/Redo（Ctrl+Z/Y）
- 📝 结构化日志
- ⚡ Electron 42.4.0
- 🐛 27 Bug 修复
- 📄 MIT License

---

**预计 5 分钟内构建完成！** 🚀
