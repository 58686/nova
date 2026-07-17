import { create } from 'zustand'
import { nanoid } from 'nanoid'
import {
  AIConfig,
  ConfigPreset,
  DEFAULT_PRESETS,
  Message,
  deletePreset,
  getPresets,
  savePreset,
} from '../services/ai'
import { DEFAULT_LOCALE, Locale, pickLocale } from '../locale'
import { isQuotaError, safeSetLocalStorage } from '../utils/storage'
import { useUIStore } from './uiStore'
import { useGenerationStore } from './generationStore'

// Re-export new stores and constants for backward compatibility
export { useUIStore } from './uiStore'
export { useGenerationStore, DEFAULT_BRIEF_FORM } from './generationStore'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface Page {
  id: string
  name: string
  path: string
  code: string
  deviceType?: DeviceType
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  name: string
  description: string
  code: string
  pages?: Page[]
  createdAt: number
  updatedAt: number
  dirName?: string
}

export interface Version {
  id: string
  projectId: string
  code: string
  description: string
  createdAt: number
  generationTarget?: GenerationTarget
  generationMode?: GenerationMode
  variantGroupId?: string
  variantLabel?: string
  baseVersionId?: string
}

export type GenerationTarget = 'full-page' | 'hero' | 'pricing' | 'cards'

export type GenerationMode = 'single' | 'triple'

export interface VariantCandidate {
  id: string
  label: string
  code: string
  description: string
  generationTarget: GenerationTarget
  generationMode: GenerationMode
  createdAt: number
  variantGroupId?: string
  baseVersionId?: string
}

export type GenerationStepStatus = 'pending' | 'active' | 'completed' | 'error'

export interface GenerationTimelineStep {
  id: string
  label: string
  description: string
  status: GenerationStepStatus
}

export type PageType = 'landing' | 'app' | 'email' | 'ecommerce' | 'portfolio' | 'component' | 'slide'

export interface BriefFormState {
  product: string
  audience: string
  goal: string
  sections: string
  notes: string
  directionId: string
  pageType: PageType
  outputLang: string
  darkMode: boolean
  designSystemId: string
}

interface AppState {
  locale: Locale
  setLocale: (locale: Locale) => void

  aiConfig: AIConfig
  updateAIConfig: (config: Partial<AIConfig>) => void

  presets: ConfigPreset[]
  applyPreset: (presetId: string) => void
  saveCurrentAsPreset: (name: string, description?: string) => void
  deletePreset: (id: string) => void

  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  currentPageId: string | null
  projectPages: Page[]
  setCurrentPage: (pageId: string) => void
  addPage: (name: string, path: string, deviceType?: DeviceType) => void
  updatePageDeviceType: (pageId: string, deviceType: DeviceType) => void
  deletePage: (pageId: string) => void
  updateCurrentPageCode: (code: string) => void
  updatePageCode: (pageId: string, code: string) => void

  versions: Version[]
  addVersion: (payload: {
    code: string
    description: string
    generationTarget?: GenerationTarget
    generationMode?: GenerationMode
    variantGroupId?: string
    variantLabel?: string
    baseVersionId?: string
  }) => string | null
  restoreVersion: (versionId: string) => void
  deleteVersion: (versionId: string) => void
  activeVersionId: string | null
  setActiveVersionId: (versionId: string | null) => void
  variantCandidates: VariantCandidate[]
  setVariantCandidates: (variants: VariantCandidate[]) => void
  clearVariantCandidates: () => void
  adoptVariantCandidate: (variantId: string) => void

  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void
  loadMessages: (projectId: string) => void
}

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'anthropic',
  apiKey: '',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 16384,
  timeout: 300000,
}

function loadLocaleFromStorage(): Locale {
  const saved = localStorage.getItem('nova-locale')
  return saved === 'en-US' || saved === 'zh-CN' ? saved : DEFAULT_LOCALE
}

function saveMessages(projectId: string, messages: Message[]) {
  try {
    localStorage.setItem(`nova-messages-${projectId}`, JSON.stringify(messages))
  } catch (error) {
    console.warn('Failed to save messages:', error)
  }
}

function loadMessagesFromStorage(projectId: string): Message[] {
  try {
    const saved = localStorage.getItem(`nova-messages-${projectId}`)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveVersionsToStorage(projectId: string, versions: Version[]) {
  const key = `nova-versions-${projectId}`
  try {
    localStorage.setItem(key, JSON.stringify(versions))
  } catch (e) {
    if (isQuotaError(e) && versions.length > 5) {
      // Prune to most recent 5 versions and retry
      try {
        localStorage.setItem(key, JSON.stringify(versions.slice(-5)))
      } catch (retryError) {
        console.error('Failed to save versions even after pruning:', retryError)
        const locale = useAppStore.getState().locale
        useUIStore.getState().setError(pickLocale(locale, '版本历史保存失败，建议导出备份。', 'Failed to save version history. Export to back up.'))
      }
    } else {
      console.warn('Failed to save versions:', e)
    }
  }
}

function loadVersionsFromStorage(projectId: string): Version[] {
  try {
    const saved = localStorage.getItem(`nova-versions-${projectId}`)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function loadProjectsFromStorage(): Project[] {
  try {
    const saved = localStorage.getItem('nova-projects')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function writeProjectFileSafe(projectDirName: string | undefined, fileName: string, content: string) {
  if (!projectDirName) {
    console.warn('Skipping file write: project directory not yet initialized')
    return
  }
  window.electronAPI?.writeProjectFile?.({ projectDirName, fileName, content })?.catch?.((error: unknown) => {
    console.error('Failed to write project file:', error)
    const locale = useAppStore.getState().locale
    useUIStore.getState().setError(pickLocale(locale, '文件保存失败，请检查磁盘空间或权限。', 'Failed to save file. Check disk space or permissions.'))
  })
}

export const useAppStore = create<AppState>((set, get) => ({
  locale: loadLocaleFromStorage(),
  setLocale: (locale) => {
    set({ locale })
    localStorage.setItem('nova-locale', locale)
  },

  aiConfig: (() => { try { return JSON.parse(localStorage.getItem('nova-ai-config') || 'null') || DEFAULT_AI_CONFIG } catch { return DEFAULT_AI_CONFIG } })(),
  updateAIConfig: (config) => {
    const newConfig = { ...get().aiConfig, ...config }
    set({ aiConfig: newConfig })
    localStorage.setItem('nova-ai-config', JSON.stringify(newConfig))
  },

  presets: getPresets(),
  applyPreset: (presetId) => {
    const savedPresets = (() => { try { return JSON.parse(localStorage.getItem('nova-presets') || '[]') } catch { return [] } })()
    const allPresets = [...DEFAULT_PRESETS, ...savedPresets]
    const preset = allPresets.find((item) => item.id === presetId)

    if (!preset) return

    get().updateAIConfig(preset.config)
    useUIStore.getState().setSuccess(pickLocale(get().locale, `已应用预设：${preset.name}`, `Applied preset: ${preset.name}`))
    setTimeout(() => useUIStore.getState().setSuccess(null), 3000)
  },
  saveCurrentAsPreset: (name, description) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      useUIStore.getState().setError(pickLocale(get().locale, '预设名称不能为空。', 'Preset name cannot be empty.'))
      return
    }

    const preset: ConfigPreset = {
      id: nanoid(),
      name: trimmedName,
      description,
      config: { ...get().aiConfig },
    }

    savePreset(preset)
    set({ presets: getPresets() })
    useUIStore.getState().setSuccess(pickLocale(get().locale, `预设"${name}"已保存`, `Preset "${name}" saved`))
    setTimeout(() => useUIStore.getState().setSuccess(null), 3000)
  },
  deletePreset: (id) => {
    deletePreset(id)
    set({ presets: getPresets() })
  },

  currentProject: null,
  setCurrentProject: (project) => {
    if (!project) {
      set({
        currentProject: null,
        messages: [],
        versions: [],
        activeVersionId: null,
        variantCandidates: [],
        currentPageId: null,
        projectPages: [],
      })
      useGenerationStore.getState().setGeneratedCode('')
      return
    }

    // Migrate: ensure project has at least one page
    let pages: Page[] = project.pages?.length ? project.pages : []
    if (pages.length === 0) {
      const defaultPage: Page = {
        id: nanoid(),
        name: '首页',
        path: '/',
        code: project.code || '',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
      pages = [defaultPage]
      const migratedProject = { ...project, pages }
      const projectId = project.id
      const updatedProjects = get().projects.map((p) => p.id === projectId ? migratedProject : p)
      set({ projects: updatedProjects })
      localStorage.setItem('nova-projects', JSON.stringify(updatedProjects))
      project = migratedProject
    }

    const messages = loadMessagesFromStorage(project.id)
    const versions = loadVersionsFromStorage(project.id)
    const firstPage = pages[0]

    set({
      currentProject: project,
      messages,
      versions,
      activeVersionId: versions.at(-1)?.id || null,
      variantCandidates: [],
      currentPageId: firstPage.id,
      projectPages: pages,
    })
    useGenerationStore.getState().setGeneratedCode(firstPage.code || '')
  },

  currentPageId: null,
  projectPages: [],
  setCurrentPage: (pageId) => {
    const { projectPages } = get()
    const page = projectPages.find((p) => p.id === pageId)
    if (!page) return
    set({ currentPageId: pageId })
    useGenerationStore.getState().setGeneratedCode(page.code)
  },
  addPage: (name, path, deviceType = 'desktop') => {
    const { currentProject, projectPages, projects } = get()
    if (!currentProject) return

    // Sanitize path: strip path traversal segments, ensure leading /
    const safePath = '/' + path.replace(/\\/g, '/').split('/').filter((s) => s && s !== '.' && s !== '..').join('/')
    const newPage: Page = { id: nanoid(), name, path: safePath, code: '', deviceType, createdAt: Date.now(), updatedAt: Date.now() }
    const updatedPages = [...projectPages, newPage]
    const updatedProject = { ...currentProject, pages: updatedPages }
    const updatedProjects = projects.map((p) => p.id === currentProject.id ? updatedProject : p)

    set({ projectPages: updatedPages, currentProject: updatedProject, currentPageId: newPage.id, projects: updatedProjects })
    useGenerationStore.getState().setGeneratedCode('')
    localStorage.setItem('nova-projects', JSON.stringify(updatedProjects))
  },
  updatePageDeviceType: (pageId, deviceType) => {
    const { currentProject, projectPages, projects } = get()
    if (!currentProject) return
    const updatedPages = projectPages.map((p) => p.id === pageId ? { ...p, deviceType } : p)
    const updatedProject = { ...currentProject, pages: updatedPages }
    const updatedProjects = projects.map((p) => p.id === currentProject.id ? updatedProject : p)
    set({ projectPages: updatedPages, currentProject: updatedProject, projects: updatedProjects })
    localStorage.setItem('nova-projects', JSON.stringify(updatedProjects))
  },
  deletePage: (pageId) => {
    const { currentProject, projectPages, currentPageId, projects } = get()
    if (!currentProject || projectPages.length <= 1) return

    const deletedIdx = projectPages.findIndex((p) => p.id === pageId)
    const updatedPages = projectPages.filter((p) => p.id !== pageId)

    // Safety check: ensure at least one page remains
    if (updatedPages.length === 0) {
      console.error('Cannot delete last page')
      return
    }

    const updatedProject = { ...currentProject, pages: updatedPages }
    const updatedProjects = projects.map((p) => p.id === currentProject.id ? updatedProject : p)

    let nextPage: Page | undefined
    if (currentPageId === pageId) {
      // Navigate to next page, or previous if deleting last
      nextPage = updatedPages[deletedIdx] ?? updatedPages[deletedIdx - 1] ?? updatedPages[0]
    } else {
      nextPage = projectPages.find((p) => p.id === currentPageId) ?? updatedPages[0]
    }

    if (!nextPage) return

    set({ projectPages: updatedPages, currentProject: updatedProject, currentPageId: nextPage.id, projects: updatedProjects })
    useGenerationStore.getState().setGeneratedCode(nextPage.code)
    localStorage.setItem('nova-projects', JSON.stringify(updatedProjects))
  },
  updateCurrentPageCode: (code) => {
    const { currentProject, currentPageId, projectPages, projects } = get()
    if (!currentProject || !currentPageId) return

    const updatedPages = projectPages.map((p) => p.id === currentPageId ? { ...p, code, updatedAt: Date.now() } : p)
    const firstPageCode = updatedPages[0]?.code ?? code
    const updatedProject = { ...currentProject, pages: updatedPages, code: firstPageCode, updatedAt: Date.now() }
    const updatedProjects = projects.map((p) => p.id === currentProject.id ? updatedProject : p)

    set({ projectPages: updatedPages, currentProject: updatedProject, projects: updatedProjects })
    safeSetLocalStorage('nova-projects', JSON.stringify(updatedProjects), get().locale)

    if (currentProject.dirName) {
      const page = updatedPages.find((p) => p.id === currentPageId)
      if (page) {
        const fileName = page.path === '/' ? 'index.html' : `${page.path.replace(/^\//, '')}.html`
        writeProjectFileSafe(currentProject.dirName, fileName, code)
      }
    }
  },
  updatePageCode: (pageId, code) => {
    const { currentProject, projectPages, projects } = get()
    if (!currentProject) return
    const updatedPages = projectPages.map((p) => p.id === pageId ? { ...p, code, updatedAt: Date.now() } : p)
    const firstPageCode = updatedPages[0]?.code ?? ''
    const updatedProject = { ...currentProject, pages: updatedPages, code: firstPageCode, updatedAt: Date.now() }
    const updatedProjects = projects.map((p) => p.id === currentProject.id ? updatedProject : p)
    set({ projectPages: updatedPages, currentProject: updatedProject, projects: updatedProjects })
    localStorage.setItem('nova-projects', JSON.stringify(updatedProjects))
  },

  versions: [],
  addVersion: ({ code, description, generationTarget = 'full-page', generationMode = 'single', variantGroupId, variantLabel, baseVersionId }) => {
    const { currentProject, versions } = get()
    if (!currentProject) return null

    // Warn if generated HTML is very large (>2MB)
    const sizeInBytes = new Blob([code]).size
    if (sizeInBytes > 2 * 1024 * 1024) {
      const sizeMB = (sizeInBytes / (1024 * 1024)).toFixed(1)
      console.warn(`Generated HTML is large (${sizeMB}MB), may impact performance`)
      useUIStore.getState().setError(pickLocale(
        get().locale,
        `生成的 HTML 较大 (${sizeMB}MB)，可能影响性能。建议简化内容或分页。`,
        `Generated HTML is large (${sizeMB}MB), may impact performance. Consider simplifying or splitting into pages.`
      ))
    }

    const newVersion: Version = {
      id: nanoid(),
      projectId: currentProject.id,
      code,
      description,
      createdAt: Date.now(),
      generationTarget,
      generationMode,
      variantGroupId,
      variantLabel,
      baseVersionId,
    }

    const updatedVersions = [...versions, newVersion]
    set({ versions: updatedVersions, activeVersionId: newVersion.id })
    saveVersionsToStorage(currentProject.id, updatedVersions)

    if (currentProject.dirName) {
      writeProjectFileSafe(currentProject.dirName, `versions/${newVersion.id}.html`, code)
    }

    return newVersion.id
  },
  restoreVersion: (versionId) => {
    const { versions } = get()
    const version = versions.find((item) => item.id === versionId)
    if (!version) return
    set({ activeVersionId: version.id })
    useGenerationStore.getState().setGeneratedCode(version.code)
    get().updateCurrentPageCode(version.code)
  },
  deleteVersion: (versionId) => {
    const { currentProject, versions, activeVersionId } = get()
    if (!currentProject) return

    const updatedVersions = versions.filter((item) => item.id !== versionId)

    // If we're deleting the currently active version, point to the next newest
    const updates: Partial<AppState> = { versions: updatedVersions }
    if (versionId === activeVersionId) {
      const fallback = updatedVersions[updatedVersions.length - 1] ?? null
      updates.activeVersionId = fallback?.id ?? null
      useGenerationStore.getState().setGeneratedCode(fallback?.code ?? '')
    }

    set(updates)
    saveVersionsToStorage(currentProject.id, updatedVersions)
  },
  activeVersionId: null,
  setActiveVersionId: (versionId) => set({ activeVersionId: versionId }),
  variantCandidates: [],
  setVariantCandidates: (variantCandidates) => set({ variantCandidates }),
  clearVariantCandidates: () => set({ variantCandidates: [] }),
  adoptVariantCandidate: (variantId) => {
    const { currentProject, updateProject, variantCandidates } = get()
    const variant = variantCandidates.find((item) => item.id === variantId)
    if (!variant) return

    useGenerationStore.getState().setGeneratedCode(variant.code)

    if (currentProject) {
      updateProject(currentProject.id, {
        code: variant.code,
        description: variant.description,
      })
    }
  },

  projects: loadProjectsFromStorage(),
  addProject: async (project) => {
    const defaultPage: Page = { id: nanoid(), name: '首页', path: '/', code: '', createdAt: Date.now(), updatedAt: Date.now() }
    const newProject: Project = {
      ...project,
      id: nanoid(),
      pages: [defaultPage],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const projects = [...get().projects, newProject]
    set({
      projects,
      currentProject: newProject,
      messages: [],
      activeVersionId: null,
      variantCandidates: [],
      versions: [],
      currentPageId: defaultPage.id,
      projectPages: [defaultPage],
    })
    useGenerationStore.getState().setGeneratedCode('')
    localStorage.setItem('nova-projects', JSON.stringify(projects))

    // Async: create project dir in the configured data directory
    if (window.electronAPI?.createProjectDir) {
      try {
        const dirName = await window.electronAPI.createProjectDir()
        if (!dirName) return
        const withDir: Project = { ...newProject, dirName }
        const updated = get().projects.map((p) => (p.id === newProject.id ? withDir : p))
        set({
          projects: updated,
          currentProject: get().currentProject?.id === newProject.id ? withDir : get().currentProject,
        })
        localStorage.setItem('nova-projects', JSON.stringify(updated))

        await window.electronAPI!.writeProjectFile({
          projectDirName: dirName,
          fileName: 'meta.json',
          content: JSON.stringify({
            id: withDir.id,
            name: withDir.name,
            description: withDir.description,
            createdAt: withDir.createdAt,
            updatedAt: withDir.updatedAt,
            dirName,
          }, null, 2),
        })
      } catch (e) {
        console.warn('Project dir creation failed:', e)
      }
    }
  },
  updateProject: (id, updates) => {
    const projects = get().projects.map((project) =>
      project.id === id ? { ...project, ...updates, updatedAt: Date.now() } : project,
    )
    const currentProject =
      get().currentProject?.id === id
        ? { ...get().currentProject!, ...updates, updatedAt: Date.now() }
        : get().currentProject

    set({ projects, currentProject })
    safeSetLocalStorage('nova-projects', JSON.stringify(projects), get().locale)

    const project = projects.find((p) => p.id === id)
    if (project?.dirName) {
      if (updates.code !== undefined) {
        writeProjectFileSafe(project.dirName, 'page.html', updates.code)
      }
      writeProjectFileSafe(project.dirName, 'meta.json', JSON.stringify({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        dirName: project.dirName,
      }, null, 2))
    }
  },
  deleteProject: (id) => {
    const project = get().projects.find((p) => p.id === id)
    const projects = get().projects.filter((p) => p.id !== id)
    const isCurrentProject = get().currentProject?.id === id

    set({
      projects,
      currentProject: isCurrentProject ? null : get().currentProject,
      activeVersionId: isCurrentProject ? null : get().activeVersionId,
      variantCandidates: isCurrentProject ? [] : get().variantCandidates,
      messages: isCurrentProject ? [] : get().messages,
      versions: isCurrentProject ? [] : get().versions,
      currentPageId: isCurrentProject ? null : get().currentPageId,
      projectPages: isCurrentProject ? [] : get().projectPages,
    })

    if (isCurrentProject) {
      useGenerationStore.getState().setGeneratedCode('')
    }

    localStorage.setItem('nova-projects', JSON.stringify(projects))
    localStorage.removeItem(`nova-messages-${id}`)
    localStorage.removeItem(`nova-versions-${id}`)

    if (project?.dirName && window.electronAPI?.deleteProjectDir) {
      window.electronAPI.deleteProjectDir({ projectDirName: project.dirName }).catch((err: unknown) => {
        console.error('Failed to delete project directory:', err)
        useUIStore.getState().setError(pickLocale(get().locale, '项目目录删除失败，可能需要手动清理。', 'Failed to delete project directory. Manual cleanup may be needed.'))
      })
    }
  },

  messages: [],
  addMessage: (message) => {
    const msg = message.id ? message : { ...message, id: nanoid() }
    const all = [...get().messages, msg]
    const newMessages = all.length > 100 ? all.slice(all.length - 100) : all
    set({ messages: newMessages })

    const { currentProject } = get()
    if (currentProject) {
      saveMessages(currentProject.id, newMessages)
      if (currentProject.dirName) {
        writeProjectFileSafe(currentProject.dirName, 'messages.json', JSON.stringify(newMessages, null, 2))
      }
    }
  },
  clearMessages: () => {
    set({ messages: [] })

    const { currentProject } = get()
    if (currentProject) {
      saveMessages(currentProject.id, [])
      if (currentProject.dirName) {
        writeProjectFileSafe(currentProject.dirName, 'messages.json', '[]')
      }
    }
  },
  loadMessages: (projectId) => {
    set({ messages: loadMessagesFromStorage(projectId) })
  },
}))
