import { useEffect, useState } from 'react'
import AIConfigManager from './components/AIConfigManager'
import ErrorBoundary from './components/ErrorBoundary'
import APITester from './components/APITester'
import CanvasView from './components/CanvasView'
import ChatPanel from './components/ChatPanel'
import Header from './components/Header'
import PreviewPanel from './components/PreviewPanel'
import SettingsModal from './components/SettingsModal'
import Sidebar from './components/Sidebar'
import ToastContainer from './components/ToastContainer'
import VersionHistory from './components/VersionHistory'
import { useLocale } from './hooks/useLocale'
import { useKeyboard } from './hooks/useKeyboard'
import { useAppStore } from './stores/appStore'
import { useSettingsStore } from './stores/settingsStore'
import { migrateSecureData } from './services/secureDataMigration'

type RightPanel = 'preview' | 'versions' | 'canvas'
type ModalPanel = 'ai-config' | 'settings' | null

function App() {
  const { showSidebar, generatedCode, isPreviewFocused, setPreviewFocused } = useAppStore()
  const { locale, text } = useLocale()
  const { load: loadSettings } = useSettingsStore()
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview')
  const [modalPanel, setModalPanel] = useState<ModalPanel>(null)

  useKeyboard()

  useEffect(() => {
    loadSettings()
    // Migrate sensitive data to encrypted storage
    migrateSecureData().catch(err => {
      console.error('Failed to migrate secure data:', err)
    })
  }, [])

  const hasGeneratedCode = generatedCode.trim().length > 0
  const showFocusedPreview = isPreviewFocused && hasGeneratedCode
  const showSidebarRail = showSidebar && !showFocusedPreview

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalPanel(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = text('Nova - AI 页面生成器', 'Nova - AI UI Generator')
  }, [locale, text])

  useEffect(() => {
    if (!hasGeneratedCode && isPreviewFocused) {
      setPreviewFocused(false)
    }
  }, [hasGeneratedCode, isPreviewFocused, setPreviewFocused])

  return (
    <div className="h-screen overflow-hidden p-3 md:p-4">
      <div className="flex h-full flex-col gap-3">
        <Header
          activePanel={showFocusedPreview ? 'preview' : rightPanel}
          onOpenAIConfig={() => setModalPanel('ai-config')}
          onOpenSettings={() => setModalPanel('settings')}
          onToggleVersions={() => setRightPanel((prev) => (prev === 'versions' ? 'preview' : 'versions'))}
          onToggleCanvas={() => setRightPanel((prev) => (prev === 'canvas' ? 'preview' : 'canvas'))}
        />

        <main className={`flex min-h-0 flex-1 ${showFocusedPreview ? 'gap-0' : 'gap-3'}`}>
          <div
            className={`overflow-hidden transition-all duration-300 ${showSidebarRail ? 'w-[236px] xl:w-[248px] opacity-100' : 'w-0 opacity-0'}`}
          >
            <Sidebar />
          </div>

          <div className={`flex min-w-0 flex-1 ${showFocusedPreview ? 'gap-0' : 'gap-3'}`}>
            {!showFocusedPreview && <ErrorBoundary label="Chat"><ChatPanel /></ErrorBoundary>}

            {showFocusedPreview ? (
              <ErrorBoundary label="Preview"><PreviewPanel focused /></ErrorBoundary>
            ) : rightPanel === 'canvas' ? (
              <CanvasView onSwitchToPreview={() => setRightPanel('preview')} />
            ) : rightPanel === 'preview' ? (
              <ErrorBoundary label="Preview"><PreviewPanel /></ErrorBoundary>
            ) : (
              <div className="flex min-w-0 flex-1 gap-3">
                <section className="shell-panel flex w-[280px] xl:w-[300px] shrink-0 flex-col overflow-hidden rounded-[26px]">
                  <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                      {text('历史', 'History')}
                    </p>
                    <h2 className="mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {text('版本记录', 'Version History')}
                    </h2>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <VersionHistory />
                  </div>
                </section>
                <ErrorBoundary label="Preview"><PreviewPanel /></ErrorBoundary>
              </div>
            )}
          </div>
        </main>
      </div>

      {modalPanel === 'ai-config' && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-6"
          onClick={() => setModalPanel(null)}
          style={{ background: 'rgba(52, 43, 40, 0.28)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="shell-panel animate-scale-in flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[30px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4 md:px-6 md:py-5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('AI 工作台', 'AI Workspace')}
                </p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {text('AI 配置与连接测试', 'AI Config and Connection Test')}
                </h2>
              </div>
              <button
                aria-label={text('关闭 AI 配置', 'Close AI config')}
                className="btn-icon"
                onClick={() => setModalPanel(null)}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
              <div
                className="min-h-0 min-w-0 flex-1 overflow-y-auto border-b xl:border-b-0 xl:border-r"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <AIConfigManager />
              </div>
              <aside className="min-h-[260px] w-full shrink-0 overflow-y-auto p-4 md:p-5 xl:w-[360px]">
                <APITester />
              </aside>
            </div>
          </div>
        </div>
      )}

      {modalPanel === 'settings' && (
        <SettingsModal onClose={() => setModalPanel(null)} />
      )}

      <ToastContainer />
    </div>
  )
}

export default App
