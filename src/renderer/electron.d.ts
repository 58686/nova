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
      proxyStream: (
        payload: { id: string; url: string; method?: string; headers?: Record<string, string>; body?: string; timeout?: number },
        onChunk: (chunk: string) => void,
      ) => Promise<{ ok: boolean; status: number; body?: string }>
      openInBrowser: (html: string) => Promise<{ success: boolean; error?: string }>

      // Settings
      getSettings: () => Promise<{ dataDir: string | null }>
      saveSettings: (settings: { dataDir: string | null }) => Promise<{ success: boolean }>
      selectDataDir: () => Promise<string | null>

      // Project file I/O
      createProjectDir: () => Promise<string | null>
      writeProjectFile: (payload: {
        projectDirName: string
        fileName: string
        content: string
      }) => Promise<{ success: boolean; error?: string }>
      readProjectFile: (payload: {
        projectDirName: string
        fileName: string
      }) => Promise<string | null>
      listProjectDirs: () => Promise<Array<{ dirName: string; meta: Record<string, unknown> }>>
      deleteProjectDir: (payload: { projectDirName: string }) => Promise<{ success: boolean }>
    }
  }
}
