# GitHub Release 发布指南 - 图文版

## 📦 如何在 GitHub 上发布 Windows 安装包

### 准备工作

确保你有：
- ✅ 构建好的安装包（`release/Nova-Setup-0.3.0.exe`）
- ✅ 便携版压缩包（`release/Nova-0.3.0-win.zip`）
- ✅ 代码已推送到 GitHub
- ✅ Tag v0.3.0 已推送

---

## 🚀 发布步骤（详细版）

### 步骤 1：访问 Releases 页面

**方法 A：直接链接**
```
https://github.com/58686/nova/releases/new
```

**方法 B：从仓库页面**
1. 访问 https://github.com/58686/nova
2. 点击右侧的 **Releases** 链接（在 About 下方）
3. 点击 **Draft a new release** 按钮

---

### 步骤 2：选择 Tag

在 "Choose a tag" 下拉框中：
1. 输入或选择：`v0.3.0`
2. 如果 tag 已推送，会显示 "Existing tag"
3. 如果 tag 未推送，会显示 "Create new tag: v0.3.0 on publish"

**重要**：确保选择 `v0.3.0`（已经创建的 tag）

---

### 步骤 3：填写 Release 信息

#### **Release Title**（必填）
```
Nova v0.3.0 - Security, Testing, and Developer Experience
```

#### **Description**（必填）
打开文件 `D:\work\opencode-project\nova\GITHUB_RELEASE_v0.3.0.md`

复制所有内容，粘贴到描述框中。

**预览效果**：
```markdown
# Nova v0.3.0 - Security, Testing, and Developer Experience

**Released:** 2026-06-16

## 🎉 Highlights

### 🔐 **API Key Encryption**
Your API keys are now protected with OS-level encryption...

### ✅ **Unit Testing Framework**
29 passing tests covering core utilities...

...（完整内容）
```

---

### 步骤 4：上传安装包

在页面底部找到 **"Attach binaries by dropping them here or selecting them."** 区域。

#### **方法 A：拖放上传**
1. 打开文件资源管理器：`D:\work\opencode-project\nova\release\`
2. 选中以下文件：
   - `Nova-Setup-0.3.0.exe`
   - `Nova-0.3.0-win.zip`
3. 拖动到 GitHub 页面的上传区域
4. 等待上传完成（显示绿色勾号）

#### **方法 B：点击选择**
1. 点击 "selecting them" 链接
2. 浏览到 `D:\work\opencode-project\nova\release\`
3. 按住 Ctrl 键，选择两个文件
4. 点击 "打开"

**上传后会显示**：
```
✓ Nova-Setup-0.3.0.exe (XX MB)
✓ Nova-0.3.0-win.zip (XX MB)
```

---

### 步骤 5：添加 Checksums（可选但推荐）

回到描述框，在末尾追加：

```markdown

---

## 🔒 Checksums (SHA256)

### Nova-Setup-0.3.0.exe
```
<SHA256 hash here>
```

### Nova-0.3.0-win.zip
```
<SHA256 hash here>
```

**如何获取 Checksums**：
在 PowerShell 中执行：
```powershell
cd D:\work\opencode-project\nova
Get-FileHash release\Nova-Setup-0.3.0.exe -Algorithm SHA256
Get-FileHash release\Nova-0.3.0-win.zip -Algorithm SHA256
```

复制输出的 `Hash` 值到上面。

---

### 步骤 6：设置 Release 选项

**勾选项**：
- ✅ **Set as the latest release** （设为最新版本）
- ❌ **Set as a pre-release** （不是预发布版）
- ❌ **Create a discussion for this release** （可选，不勾也行）

**Target branch**：
- 应该自动选择 `main`（保持默认）

---

### 步骤 7：发布

1. **预览**（可选）：点击 **Preview** tab 查看效果
2. **发布**：点击绿色按钮 **Publish release**

---

## ✅ 验证发布成功

### 检查 1：Release 页面
访问 https://github.com/58686/nova/releases

应该看到：
- ✅ v0.3.0 显示为 "Latest" 标签
- ✅ 标题和描述正确显示
- ✅ 两个下载链接：
  - `Nova-Setup-0.3.0.exe`
  - `Nova-0.3.0-win.zip`

### 检查 2：下载测试
点击 `Nova-Setup-0.3.0.exe`，应该：
- ✅ 开始下载
- ✅ 文件大小正确（~150MB）

### 检查 3：仓库首页
访问 https://github.com/58686/nova

右侧应该显示：
- ✅ Latest release: v0.3.0
- ✅ 显示发布时间

---

## 📱 用户如何下载和安装

### 下载
1. 用户访问：https://github.com/58686/nova/releases
2. 点击最新版本 **v0.3.0**
3. 在 **Assets** 区域点击 `Nova-Setup-0.3.0.exe` 下载

### 安装
1. 双击 `Nova-Setup-0.3.0.exe`
2. Windows 可能显示 SmartScreen 警告（因为未签名）
   - 点击 "更多信息"
   - 点击 "仍要运行"
3. 选择安装路径
4. 完成安装
5. 从开始菜单启动 Nova

### 便携版
1. 下载 `Nova-0.3.0-win.zip`
2. 解压到任意文件夹
3. 双击 `Nova.exe` 运行（无需安装）

---

## 🎯 Release 最佳实践

### ✅ 做
- ✅ 提供详细的变更说明
- ✅ 包含安装器和便携版
- ✅ 添加 SHA256 checksums
- ✅ 使用语义化版本（v0.3.0）
- ✅ 标记为 Latest release

### ❌ 避免
- ❌ 上传未测试的版本
- ❌ 忘记推送 tag
- ❌ 使用模糊的版本号
- ❌ 缺少使用说明

---

## 🔧 常见问题

### Q1: SmartScreen 警告怎么办？
**A**: 这是正常的。未签名的应用会触发此警告。

**解决方案**：
- 短期：用户点击"更多信息" → "仍要运行"
- 长期：购买代码签名证书（~$200-500/年）

### Q2: 如何更新 Release？
**A**: 
1. 访问 https://github.com/58686/nova/releases
2. 点击 v0.3.0 旁边的铅笔图标（Edit）
3. 修改内容
4. 点击 "Update release"

### Q3: 如何删除 Release？
**A**:
1. Edit release
2. 滚动到底部
3. 点击红色 "Delete" 按钮
4. 确认删除

**注意**：删除 Release 不会删除 Git Tag

### Q4: 上传文件有大小限制吗？
**A**: 
- 单个文件：最大 2GB
- 总大小：无限制
- Nova 的安装包约 150MB，完全没问题

### Q5: 如何让用户自动收到更新通知？
**A**: GitHub 提供 Watch 功能：
- 用户点击仓库的 **Watch** → **Custom** → 勾选 **Releases**
- 每次发布新版本，Watch 的用户会收到邮件通知

---

## 📊 发布后的数据

发布后，你可以在 Release 页面看到：
- 📥 下载次数（每个文件单独统计）
- 📅 发布时间
- 👥 GitHub 会在 Activity feed 中显示

**统计位置**：
```
https://github.com/58686/nova/releases
```
每个文件旁边会显示下载数（如 "125 downloads"）

---

## 🎉 完成清单

发布完成后：
- [ ] Release 页面显示 v0.3.0
- [ ] 两个文件可以下载
- [ ] 描述和格式正确
- [ ] 标记为 Latest
- [ ] Checksums 已添加
- [ ] 测试下载链接

---

## 📞 需要帮助？

如果遇到问题：
1. 检查是否已推送 tag：`git push origin v0.3.0`
2. 检查是否已推送 commits：`git push origin main`
3. 确认文件路径正确
4. 尝试刷新 GitHub 页面

---

**按照这个指南，5 分钟内即可完成发布！** 🚀
