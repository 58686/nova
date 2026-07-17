import { useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useLocale } from '../hooks/useLocale'
import { DeviceType, Page, useAppStore } from '../stores/appStore'

// ── Device configs ────────────────────────────────────────────────────────────

const DEVICE_CONFIGS = {
  mobile: { label: 'Mobile', labelZh: '手机', srcW: 390, srcH: 844, cardW: 220, bezel: 10, radius: 30, headerH: 24, footerH: 8 },
  tablet: { label: 'Tablet', labelZh: '平板', srcW: 768, srcH: 1024, cardW: 300, bezel: 12, radius: 24, headerH: 20, footerH: 8 },
  desktop: { label: 'Desktop', labelZh: '桌面', srcW: 1280, srcH: 800, cardW: 400, bezel: 8, radius: 8, headerH: 32, footerH: 0 },
} as const

const NAV_SCRIPT = `<script data-nova-nav>(function(){document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(!h||h.startsWith('#')||h.startsWith('javascript:')||h.startsWith('mailto:')||h.startsWith('tel:')||/^https?:\\/\\//.test(h))return;e.preventDefault();window.parent.postMessage({type:'nova-navigate',href:h},'*');},true);})();</script>`

function buildDoc(code: string): string {
  if (!code.trim()) return ''
  const injected = `${NAV_SCRIPT}<style data-nova>*{box-sizing:border-box}html,body{min-height:100%;margin:0;overflow-x:hidden;}img,svg,video,canvas{max-width:100%;}</style>`
  const trimmed = code.trim()
  if (/<head[^>]*>/i.test(trimmed)) return trimmed.replace(/<head([^>]*)>/i, `<head$1>${injected}`)
  return `<!DOCTYPE html><html><head>${injected}</head><body>${trimmed}</body></html>`
}

// ── Device frame chrome ───────────────────────────────────────────────────────

function MobileStatusBar() {
  return (
    <div style={{
      height: 24,
      background: 'rgba(70, 61, 55, 0.96)',
      borderRadius: '20px 20px 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      flexShrink: 0,
    }}>
      <span style={{ color: 'rgba(255,250,246,0.6)', fontSize: 8, fontWeight: 700, fontFamily: 'system-ui' }}>9:41</span>
      <div style={{ width: 52, height: 10, borderRadius: 8, background: 'rgba(52, 43, 40, 0.7)' }} />
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          {[4, 6, 8, 10].map((h, i) => (
            <div key={i} style={{ width: 2, height: h, borderRadius: 1, background: i < 3 ? 'rgba(255,250,246,0.5)' : 'rgba(255,250,246,0.15)' }} />
          ))}
        </div>
        <div style={{ width: 14, height: 7, border: '1.5px solid rgba(255,250,246,0.3)', borderRadius: 2, padding: 1 }}>
          <div style={{ width: '70%', height: '100%', background: 'rgba(255,250,246,0.45)', borderRadius: 1 }} />
        </div>
      </div>
    </div>
  )
}

function TabletStatusBar() {
  return (
    <div style={{
      height: 20,
      background: 'rgba(70, 61, 55, 0.96)',
      borderRadius: '16px 16px 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      flexShrink: 0,
    }}>
      <span style={{ color: 'rgba(255,250,246,0.5)', fontSize: 7, fontWeight: 700, fontFamily: 'system-ui' }}>9:41</span>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <div style={{ width: 12, height: 5.5, border: '1px solid rgba(255,250,246,0.25)', borderRadius: 1.5, padding: '0 1.5px' }}>
          <div style={{ width: '70%', height: '100%', background: 'rgba(255,250,246,0.4)', borderRadius: 0.5 }} />
        </div>
      </div>
    </div>
  )
}

function DesktopBrowserBar({ url }: { url: string }) {
  return (
    <div style={{
      height: 32,
      background: 'rgba(70, 61, 55, 0.96)',
      borderRadius: '7px 7px 0 0',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 10px',
      flexShrink: 0,
      borderBottom: '1px solid rgba(122, 101, 88, 0.15)',
    }}>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#e8685a' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#e5b642' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#5cc25d' }} />
      </div>
      <div style={{
        flex: 1,
        height: 18,
        background: 'rgba(52, 43, 40, 0.6)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 4,
        overflow: 'hidden',
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,250,246,0.25)" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        <span style={{ color: 'rgba(255,250,246,0.35)', fontSize: 7.5, fontFamily: 'system-ui', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          localhost{url || '/'}
        </span>
      </div>
    </div>
  )
}

function EmptySlate() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, rgba(255,250,244,0.95) 0%, rgba(244,239,231,0.9) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}>
      <svg width="20" height="20" fill="none" stroke="var(--text-disabled)" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>未生成</span>
    </div>
  )
}

// ── Page Card ─────────────────────────────────────────────────────────────────

function PageCard({ page, index, isActive, deviceType, onClick }: { page: Page; index: number; isActive: boolean; deviceType: DeviceType; onClick: () => void }) {
  const cfg = DEVICE_CONFIGS[deviceType]
  const scale = cfg.cardW / cfg.srcW
  const contentH = Math.round(cfg.srcH * scale) - cfg.headerH - cfg.footerH
  const frameH = Math.round(cfg.srcH * scale) + cfg.bezel * 2
  const frameW = cfg.cardW + cfg.bezel * 2
  const hasCode = page.code.trim().length > 0
  const doc = hasCode ? buildDoc(page.code) : ''
  const [hovered, setHovered] = useState(false)

  return (
    <div
      data-card="1"
      style={{ display: 'flex', flexDirection: 'column', gap: 10, userSelect: 'none' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-disabled)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{
          flex: 1,
          fontSize: 11.5,
          fontWeight: 600,
          color: isActive ? 'var(--text-primary)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: frameW - 32,
          transition: 'color 0.15s',
        }}>
          {page.name}
        </span>
        {isActive && (
          <span className="badge badge-accent" style={{ fontSize: 9, padding: '1px 8px' }}>
            当前
          </span>
        )}
      </div>

      {/* Device frame */}
      <div
        style={{
          width: frameW,
          height: frameH,
          borderRadius: cfg.radius + cfg.bezel / 2,
          background: deviceType === 'desktop'
            ? 'rgba(70, 61, 55, 0.92)'
            : 'rgba(60, 50, 44, 0.95)',
          border: `1.5px solid ${isActive ? 'var(--border-accent)' : hovered ? 'var(--border-strong)' : 'var(--border-default)'}`,
          boxShadow: isActive
            ? '0 0 0 4px var(--accent-glow), var(--shadow-lg)'
            : hovered
              ? 'var(--shadow-lg)'
              : 'var(--shadow-md)',
          padding: cfg.bezel,
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out)',
          overflow: 'hidden',
          cursor: 'pointer',
          transform: hovered && !isActive ? 'translateY(-3px)' : 'none',
        }}
      >
        {deviceType === 'mobile' && <MobileStatusBar />}
        {deviceType === 'tablet' && <TabletStatusBar />}
        {deviceType === 'desktop' && <DesktopBrowserBar url={page.path} />}

        <div style={{
          width: cfg.cardW,
          height: contentH,
          overflow: 'hidden',
          borderRadius: deviceType === 'desktop' ? '0 0 2px 2px' : `0 0 ${cfg.radius - 4}px ${cfg.radius - 4}px`,
          position: 'relative',
          background: 'white',
          flexShrink: 0,
        }}>
          {hasCode ? (
            <iframe
              srcDoc={doc}
              sandbox="allow-scripts"
              style={{ width: cfg.srcW, height: cfg.srcH, border: 'none', transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}
              title={page.name}
            />
          ) : (
            <EmptySlate />
          )}
        </div>

        {(deviceType === 'mobile' || deviceType === 'tablet') && cfg.footerH > 0 && (
          <div style={{ height: cfg.footerH, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <div style={{ width: 40, height: 3.5, borderRadius: 2, background: 'rgba(255,250,246,0.15)' }} />
          </div>
        )}
      </div>

      {/* Path */}
      <p style={{ fontSize: 10, color: 'var(--text-disabled)', paddingInline: 2, margin: 0 }}>{page.path || '/'}</p>
    </div>
  )
}

// ── Device type icon buttons ──────────────────────────────────────────────────

const DEVICE_ICONS: Record<DeviceType, JSX.Element> = {
  mobile: (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="5" y="1" width="14" height="22" rx="3" strokeWidth={2} />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  tablet: (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="2" width="18" height="20" rx="3" strokeWidth={2} />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  desktop: (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M8 21h8M12 17v4" />
    </svg>
  ),
}

// ── Canvas View ───────────────────────────────────────────────────────────────

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.85, 1, 1.25, 1.5, 2]

interface CanvasViewProps {
  onSwitchToPreview?: () => void
}

export default function CanvasView({ onSwitchToPreview }: CanvasViewProps) {
  const { projectPages, currentPageId, setCurrentPage, addPage, currentProject } = useAppStore(useShallow(s => ({
    projectPages: s.projectPages,
    currentPageId: s.currentPageId,
    setCurrentPage: s.setCurrentPage,
    addPage: s.addPage,
    currentProject: s.currentProject,
  })))
  const { text } = useLocale()

  const [deviceType, setDeviceType] = useState<DeviceType>('mobile')
  const [zoom, setZoom] = useState(0.85)
  const [offset, setOffset] = useState({ x: 48, y: 48 })
  const [dragging, setDragging] = useState(false)
  const [didDrag, setDidDrag] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)

  // Listen for in-canvas iframe navigation (link clicks inside preview iframes)
  const handleIframeNav = useCallback((e: MessageEvent) => {
    if (e.data?.type !== 'nova-navigate') return
    const href = (e.data.href as string).split('?')[0].split('#')[0]
    const normalized = href.replace(/\.html?$/, '').replace(/^\.\//, '').replace(/^\/+/, '') || 'index'
    const matchPath = normalized === 'index' ? '/' : `/${normalized}`
    const page = projectPages.find((p) => p.path === matchPath || p.path === `/${normalized}`)
    if (page) setCurrentPage(page.id)
  }, [projectPages, setCurrentPage])

  useEffect(() => {
    window.addEventListener('message', handleIframeNav)
    return () => window.removeEventListener('message', handleIframeNav)
  }, [handleIframeNav])

  // Scroll to pan + Ctrl+scroll to zoom (non-passive)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Zoom — anchor around cursor position
        const rect = el.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top

        setZoom((prevZoom) => {
          const raw = prevZoom * (1 - e.deltaY * 0.003)
          const next = Math.max(0.25, Math.min(2, +raw.toFixed(3)))
          if (!isFinite(next)) return prevZoom
          const ratio = next / prevZoom
          setOffset((prev) => ({
            x: cx - (cx - prev.x) * ratio,
            y: cy - (cy - prev.y) * ratio,
          }))
          return next
        })
      } else {
        // Pan — regular scroll moves the canvas
        const speed = 1
        setOffset((prev) => ({
          x: prev.x - e.deltaX * speed,
          y: prev.y - e.deltaY * speed,
        }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Drag-to-pan: works everywhere (including over cards)
  // Uses a 4px movement threshold to distinguish click from drag
  const DRAG_THRESHOLD = 4

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return // left button only
    setDragging(true)
    setDidDrag(false)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
    e.preventDefault()
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    if (!didDrag && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
    setDidDrag(true)
    setOffset({
      x: dragOrigin.current.ox + dx,
      y: dragOrigin.current.oy + dy,
    })
  }

  const onMouseUp = (_e: React.MouseEvent) => {
    setDragging(false)
    setDidDrag(false)
  }

  const stepZoom = (dir: 1 | -1) => {
    setZoom((z) => {
      if (dir === 1) {
        const above = ZOOM_STEPS.filter((s) => s > z + 0.001)
        return above.length ? above[0] : ZOOM_STEPS[ZOOM_STEPS.length - 1]
      }
      const below = ZOOM_STEPS.filter((s) => s < z - 0.001)
      return below.length ? below[below.length - 1] : ZOOM_STEPS[0]
    })
  }

  const atMinZoom = zoom <= ZOOM_STEPS[0] + 0.001
  const atMaxZoom = zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.001

  const resetView = () => { setZoom(0.85); setOffset({ x: 48, y: 48 }) }

  if (!currentProject) {
    return (
      <div className="shell-panel flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-[28px]">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-[28px]"
          style={{ background: 'linear-gradient(135deg, rgba(217, 183, 159, 0.24), rgba(166, 124, 116, 0.18))' }}
        >
          <svg className="h-10 w-10" fill="none" stroke="currentColor" style={{ color: 'var(--accent-dark)' }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {text('画布视图', 'Canvas View')}
          </h3>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {text('先选择或新建一个项目', 'Select or create a project first')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="shell-panel flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px]">
      {/* Toolbar */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <p className="shrink-0 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('页面画布', 'Page Canvas')}
            </p>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{currentProject.name}</h2>
            <span className="badge badge-accent">{projectPages.length} {text('个页面', 'pages')}</span>
          </div>

          {/* Global device type */}
          <div className="flex items-center gap-0.5 rounded-[12px] p-0.5" style={{ background: 'rgba(255,255,255,0.4)' }}>
            {(['mobile', 'tablet', 'desktop'] as DeviceType[]).map((d) => (
              <button
                key={d}
                title={DEVICE_CONFIGS[d].label}
                onClick={() => setDeviceType(d)}
                className="flex items-center justify-center rounded-[9px] p-1.5 transition-all"
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  cursor: 'pointer',
                  background: deviceType === d ? 'rgba(255,255,255,0.9)' : 'transparent',
                  color: deviceType === d ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: deviceType === d ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {DEVICE_ICONS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 rounded-[12px] p-0.5" style={{ background: 'rgba(255,255,255,0.4)' }}>
            <button
              className="btn-icon disabled:opacity-30"
              onClick={() => stepZoom(-1)}
              style={{ width: 26, height: 26 }}
              disabled={atMinZoom}
              title={atMinZoom ? text('已到最小缩放', 'Minimum zoom reached') : 'Zoom out'}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
              </svg>
            </button>
            <button
              onClick={resetView}
              style={{
                minWidth: 44,
                height: 26,
                padding: '0 4px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-secondary)',
              }}
              title="Reset view"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              className="btn-icon disabled:opacity-30"
              onClick={() => stepZoom(1)}
              style={{ width: 26, height: 26 }}
              disabled={atMaxZoom}
              title={atMaxZoom ? text('已到最大缩放', 'Maximum zoom reached') : 'Zoom in'}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <button
            className="btn btn-ghost text-xs"
            onClick={() => addPage(text('新页面', 'New Page'), `/${Date.now().toString(36)}`)}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {text('添加页面', 'Add page')}
          </button>

          {onSwitchToPreview && (
            <button className="btn btn-primary text-xs" onClick={onSwitchToPreview}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              {text('预览当前页', 'Preview')}
            </button>
          )}
        </div>
      </div>

      {/* Infinite canvas viewport */}
      <div
        ref={viewportRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--bg-secondary)',
          cursor: dragging ? 'grabbing' : 'grab',
          // Warm dot grid background
          backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { setDragging(false); setDidDrag(false) }}
      >
        {projectPages.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                background: 'linear-gradient(135deg, rgba(217, 183, 159, 0.2), rgba(166, 124, 116, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" fill="none" stroke="var(--text-disabled)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              {text('还没有页面，点击添加', 'No pages yet — click Add page')}
            </p>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 52,
              alignItems: 'flex-start',
              willChange: 'transform',
              transition: dragging ? 'none' : 'transform 0.12s var(--ease-out)',
            }}
          >
            {projectPages.map((page, i) => (
              <PageCard
                key={page.id}
                page={page}
                index={i}
                isActive={page.id === currentPageId}
                deviceType={deviceType}
                onClick={() => { if (!didDrag) setCurrentPage(page.id) }}
              />
            ))}
          </div>
        )}

        {/* Hint */}
        <div
          className="badge"
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            color: 'var(--text-muted)',
            fontSize: 10,
            fontWeight: 500,
            border: '1px solid var(--border-subtle)',
            padding: '4px 12px',
          }}
        >
          {text('滚轮移动 · Ctrl+滚轮缩放 · 拖拽平移', 'Scroll to pan · Ctrl+scroll to zoom · Drag to move')}
        </div>
      </div>
    </div>
  )
}
