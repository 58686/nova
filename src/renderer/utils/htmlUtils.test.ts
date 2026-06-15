import { describe, it, expect } from 'vitest'
import {
  getVisibleTextLength,
  getScriptCount,
  getCanvasCount,
  looksLikeBlankShell,
} from '../utils/htmlUtils'

describe('htmlUtils', () => {
  describe('getVisibleTextLength', () => {
    it('should count visible text ignoring tags', () => {
      const html = '<div><p>Hello World</p><span>Test</span></div>'
      expect(getVisibleTextLength(html)).toBe(16) // "Hello World Test" (with space)
    })

    it('should ignore script tags', () => {
      const html = '<body><p>Visible</p><script>const x = 123;</script></body>'
      expect(getVisibleTextLength(html)).toBe(7) // "Visible"
    })

    it('should ignore style tags', () => {
      const html = '<body><p>Text</p><style>body { color: red; }</style></body>'
      expect(getVisibleTextLength(html)).toBe(4) // "Text"
    })

    it('should ignore noscript tags', () => {
      const html = '<body><p>Main</p><noscript>No JS</noscript></body>'
      expect(getVisibleTextLength(html)).toBe(4) // "Main"
    })

    it('should normalize whitespace', () => {
      const html = '<div>  Multiple   \n  spaces  </div>'
      expect(getVisibleTextLength(html)).toBe(15) // "Multiple spaces"
    })

    it('should extract from body tag if present', () => {
      const html = '<html><head><title>Title</title></head><body>Content</body></html>'
      expect(getVisibleTextLength(html)).toBe(7) // "Content" (ignores title)
    })
  })

  describe('getScriptCount', () => {
    it('should count script tags', () => {
      const html = '<script src="a.js"></script><script>alert();</script>'
      expect(getScriptCount(html)).toBe(2)
    })

    it('should return 0 for no scripts', () => {
      const html = '<div>No scripts here</div>'
      expect(getScriptCount(html)).toBe(0)
    })

    it('should be case insensitive', () => {
      const html = '<SCRIPT></SCRIPT><Script></Script>'
      expect(getScriptCount(html)).toBe(2)
    })
  })

  describe('getCanvasCount', () => {
    it('should count canvas tags', () => {
      const html = '<canvas id="chart"></canvas><canvas></canvas>'
      expect(getCanvasCount(html)).toBe(2)
    })

    it('should return 0 for no canvas', () => {
      const html = '<div>No canvas</div>'
      expect(getCanvasCount(html)).toBe(0)
    })
  })

  describe('looksLikeBlankShell', () => {
    it('should detect empty body', () => {
      const html = '<html><body></body></html>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })

    it('should detect React root shell', () => {
      const html = '<body><div id="root"></div><script src="react.js"></script></body>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })

    it('should detect Vue app shell', () => {
      const html = '<body><div id="app"></div><script>new Vue()</script></body>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })

    it('should detect canvas-only content', () => {
      const html = '<body><canvas id="game"></canvas></body>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })

    it('should NOT flag slide presentations', () => {
      const html = '<body><section class="slide">Slide 1</section><section class="slide">Slide 2</section></body>'
      expect(looksLikeBlankShell(html)).toBe(false)
    })

    it('should NOT flag meaningful content', () => {
      const html = `
        <body>
          <h1>Welcome</h1>
          <p>This is a real landing page with enough content to be meaningful.</p>
          <button>Click me</button>
        </body>
      `
      expect(looksLikeBlankShell(html)).toBe(false)
    })

    it('should detect delayed reveal patterns', () => {
      const html = '<body style="opacity: 0"><h1>Hidden</h1><script src="reveal.js"></script></body>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })

    it('should detect charting library shells', () => {
      const html = '<body><div id="chart"></div><script src="echarts.min.js"></script><script>init()</script></body>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })

    it('should NOT flag if no body tag', () => {
      const html = '<div>No body wrapper</div>'
      expect(looksLikeBlankShell(html)).toBe(true)
    })
  })
})
