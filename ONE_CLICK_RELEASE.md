# 🚀 一键自动发布

## 网络恢复后，运行这个脚本：

```powershell
cd D:\work\opencode-project\nova
.\release-auto.ps1
```

**就这一个命令！**

---

## 脚本会做什么

1. ✅ 推送所有 commits 到 GitHub
2. ✅ 删除旧的 v0.3.0 tag
3. ✅ 创建并推送新 tag（触发 GitHub Actions）

---

## GitHub Actions 会自动

- ✅ 安装依赖
- ✅ 运行 29 个测试
- ✅ 构建 Windows 安装包
- ✅ 生成 SHA256 checksums
- ✅ 创建 GitHub Release
- ✅ 上传安装包和 checksums

**预计时间**: 10-15 分钟

---

## 查看进度

**Actions 页面**:
```
https://github.com/58686/nova/actions
```

**Release 页面** (完成后):
```
https://github.com/58686/nova/releases
```

---

## 如果脚本失败

手动执行这 3 个命令：

```powershell
# 1. 推送 commits
git push origin main

# 2. 重置 tag
git tag -d v0.3.0
git push origin :refs/tags/v0.3.0

# 3. 创建新 tag (触发 CI)
git tag v0.3.0
git push origin v0.3.0
```

---

## 🎉 完成！

运行脚本后，你就可以：
- ☕ 喝杯咖啡
- 🚶 散个步
- 💤 睡个觉

GitHub Actions 会自动完成一切！

---

**文件位置**: `D:\work\opencode-project\nova\release-auto.ps1`
