# Nova v0.3.0 自动发布脚本
# 使用 GitHub Actions 自动构建和发布

Write-Host "`n🚀 Nova v0.3.0 自动发布脚本`n" -ForegroundColor Green

# 检查当前目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 步骤 1: 推送所有 commits
Write-Host "📤 步骤 1/3: 推送 commits..." -ForegroundColor Cyan
try {
    git push origin main
    Write-Host "✓ Commits 推送成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 推送失败: $_" -ForegroundColor Red
    Write-Host "请检查网络连接后重试" -ForegroundColor Yellow
    exit 1
}

# 步骤 2: 删除旧 tag（如果存在）
Write-Host "`n🏷️  步骤 2/3: 重置 v0.3.0 tag..." -ForegroundColor Cyan
try {
    # 删除本地 tag
    git tag -d v0.3.0 2>$null
    Write-Host "✓ 删除本地 tag" -ForegroundColor Gray

    # 删除远程 tag
    git push origin :refs/tags/v0.3.0 2>$null
    Write-Host "✓ 删除远程 tag" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Tag 可能不存在，跳过删除" -ForegroundColor Yellow
}

# 步骤 3: 创建并推送新 tag（触发 GitHub Actions）
Write-Host "`n🎯 步骤 3/3: 创建并推送 v0.3.0 tag (触发 CI)..." -ForegroundColor Cyan
try {
    git tag v0.3.0
    Write-Host "✓ 创建 tag v0.3.0" -ForegroundColor Green

    git push origin v0.3.0
    Write-Host "✓ 推送 tag v0.3.0" -ForegroundColor Green
} catch {
    Write-Host "❌ Tag 推送失败: $_" -ForegroundColor Red
    exit 1
}

# 完成
Write-Host "`n✨ 推送完成!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📊 GitHub Actions 正在自动构建..." -ForegroundColor Cyan
Write-Host ""
Write-Host "预计时间: 10-15 分钟" -ForegroundColor Yellow
Write-Host ""
Write-Host "查看进度:" -ForegroundColor White
Write-Host "  https://github.com/58686/nova/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "完成后查看 Release:" -ForegroundColor White
Write-Host "  https://github.com/58686/nova/releases" -ForegroundColor Blue
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🎉 你现在可以关闭终端，GitHub Actions 会自动完成剩余工作!" -ForegroundColor Green
Write-Host ""

# 可选: 打开浏览器
$openBrowser = Read-Host "是否打开 GitHub Actions 页面? (Y/n)"
if ($openBrowser -ne 'n' -and $openBrowser -ne 'N') {
    Start-Process "https://github.com/58686/nova/actions"
}
