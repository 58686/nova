export {}

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (content: string, defaultName?: string) => Promise<{ success: boolean; path?: string }>
      loadFile: () => Promise<{ success: boolean; content?: string; path?: string }>
      exportHtml: (html: string, defaultName?: string) => Promise<{ success: boolean; path?: string }>
      proxyRequest: (payload: {
        url: string
        method?: string
        headers?: Record<string, string>
        body?: string
        timeout?: number
      }) => Promise<{
        ok: boolean
        status: number
        headers: Record<string, string>
        body: string
      }>
    }
  }
}
