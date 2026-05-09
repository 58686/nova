import { create } from 'zustand'
import { nanoid } from 'nanoid'
import {
  AIConfig,
  ConfigPreset,
  DEFAULT_PRESETS,
  Message,
  TestResult,
  deletePreset,
  getAIService,
  getPresets,
  savePreset,
} from '../services/ai'
import { DEFAULT_LOCALE, Locale, pickLocale } from '../locale'

export interface Project {
  id: string
  name: string
  description: string
  code: string
  createdAt: number
  updatedAt: number
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

export interface BriefFormState {
  product: string
  audience: string
  goal: string
  sections: string
  notes: string
  directionId: string
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

  testResult: TestResult | null
  isTesting: boolean
  testConnection: () => Promise<void>

  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

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
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void
  loadMessages: (projectId: string) => void

  isGenerating: boolean
  setGenerating: (generating: boolean) => void

  abortController: AbortController | null
  setAbortController: (controller: AbortController | null) => void
  cancelGeneration: () => void

  generatedCode: string
  setGeneratedCode: (code: string) => void
  briefForm: BriefFormState
  setBriefForm: (updates: Partial<BriefFormState>) => void
  generationTimeline: GenerationTimelineStep[]
  setGenerationTimeline: (steps: GenerationTimelineStep[]) => void
  activeGenerationLabel: string | null
  setActiveGenerationLabel: (label: string | null) => void

  showSettings: boolean
  toggleSettings: () => void
  isPreviewFocused: boolean
  setPreviewFocused: (focused: boolean) => void
  togglePreviewFocus: () => void
  showSidebar: boolean
  toggleSidebar: () => void

  error: string | null
  setError: (error: string | null) => void

  success: string | null
  setSuccess: (msg: string | null) => void
}

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'anthropic',
  apiKey: '',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 60000,
}

export const DEFAULT_BRIEF_FORM: BriefFormState = {
  product: '',
  audience: '',
  goal: '',
  sections: 'Hero, social proof, features, CTA',
  notes: '',
  directionId: 'editorial-premium',
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
  try {
    localStorage.setItem(`nova-versions-${projectId}`, JSON.stringify(versions))
  } catch (error) {
    console.warn('Failed to save versions:', error)
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

export const useAppStore = create<AppState>((set, get) => ({
  locale: loadLocaleFromStorage(),
  setLocale: (locale) => {
    set({ locale })
    localStorage.setItem('nova-locale', locale)
  },

  aiConfig: JSON.parse(localStorage.getItem('nova-ai-config') || 'null') || DEFAULT_AI_CONFIG,
  updateAIConfig: (config) => {
    const newConfig = { ...get().aiConfig, ...config }
    set({ aiConfig: newConfig })
    getAIService().updateConfig(newConfig)
    localStorage.setItem('nova-ai-config', JSON.stringify(newConfig))
  },

  presets: getPresets(),
  applyPreset: (presetId) => {
    const allPresets = [...DEFAULT_PRESETS, ...JSON.parse(localStorage.getItem('nova-presets') || '[]')]
    const preset = allPresets.find((item) => item.id === presetId)

    if (!preset) return

    get().updateAIConfig(preset.config)
    set({
      success: pickLocale(get().locale, `已应用预设：${preset.name}`, `Applied preset: ${preset.name}`),
    })
    setTimeout(() => set({ success: null }), 3000)
  },
  saveCurrentAsPreset: (name, description) => {
    const preset: ConfigPreset = {
      id: nanoid(),
      name,
      description,
      config: { ...get().aiConfig },
    }

    savePreset(preset)
    set({
      presets: getPresets(),
      success: pickLocale(get().locale, `预设“${name}”已保存`, `Preset "${name}" saved`),
    })
    setTimeout(() => set({ success: null }), 3000)
  },
  deletePreset: (id) => {
    deletePreset(id)
    set({ presets: getPresets() })
  },

  testResult: null,
  isTesting: false,
  testConnection: async () => {
    set({ isTesting: true, testResult: null })

    try {
      const result = await getAIService().testConnection()
      set({ testResult: result, isTesting: false })
    } catch (error: any) {
      set({
        testResult: { success: false, error: error.message },
        isTesting: false,
      })
    }
  },

  currentProject: null,
  setCurrentProject: (project) => {
    set({ currentProject: project })

    if (!project) {
      set({
        messages: [],
        generatedCode: '',
        versions: [],
        activeVersionId: null,
        variantCandidates: [],
      })
      return
    }

    const messages = loadMessagesFromStorage(project.id)
    const versions = loadVersionsFromStorage(project.id)

    set({
      messages,
      generatedCode: project.code || '',
      versions,
      activeVersionId: versions.at(-1)?.id || null,
      variantCandidates: [],
    })
  },

  versions: [],
  addVersion: ({ code, description, generationTarget = 'full-page', generationMode = 'single', variantGroupId, variantLabel, baseVersionId }) => {
    const { currentProject, versions } = get()
    if (!currentProject) return null

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
    return newVersion.id
  },
  restoreVersion: (versionId) => {
    const { versions } = get()
    const version = versions.find((item) => item.id === versionId)
    if (!version) return

    set({ generatedCode: version.code, activeVersionId: version.id })
  },
  deleteVersion: (versionId) => {
    const { currentProject, versions } = get()
    if (!currentProject) return

    const updatedVersions = versions.filter((item) => item.id !== versionId)
    set({ versions: updatedVersions })
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

    set({ generatedCode: variant.code })

    if (currentProject) {
      updateProject(currentProject.id, {
        code: variant.code,
        description: variant.description,
      })
    }
  },

  projects: loadProjectsFromStorage(),
  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: nanoid(),
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
      generatedCode: '',
      versions: [],
    })
    localStorage.setItem('nova-projects', JSON.stringify(projects))
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
    localStorage.setItem('nova-projects', JSON.stringify(projects))
  },
  deleteProject: (id) => {
    const projects = get().projects.filter((project) => project.id !== id)
    const isCurrentProject = get().currentProject?.id === id

    set({
      projects,
      currentProject: isCurrentProject ? null : get().currentProject,
      activeVersionId: isCurrentProject ? null : get().activeVersionId,
      variantCandidates: isCurrentProject ? [] : get().variantCandidates,
      messages: isCurrentProject ? [] : get().messages,
      generatedCode: isCurrentProject ? '' : get().generatedCode,
      versions: isCurrentProject ? [] : get().versions,
    })

    localStorage.setItem('nova-projects', JSON.stringify(projects))
    localStorage.removeItem(`nova-messages-${id}`)
    localStorage.removeItem(`nova-versions-${id}`)
  },

  messages: [],
  addMessage: (message) => {
    const newMessages = [...get().messages, message]
    set({ messages: newMessages })

    const { currentProject } = get()
    if (currentProject) {
      saveMessages(currentProject.id, newMessages)
    }
  },
  clearMessages: () => {
    set({ messages: [] })

    const { currentProject } = get()
    if (currentProject) {
      saveMessages(currentProject.id, [])
    }
  },
  loadMessages: (projectId) => {
    set({ messages: loadMessagesFromStorage(projectId) })
  },

  isGenerating: false,
  setGenerating: (generating) => set({ isGenerating: generating }),

  abortController: null,
  setAbortController: (controller) => set({ abortController: controller }),
  cancelGeneration: () => {
    const { abortController } = get()
    if (!abortController) return

    abortController.abort()
    set({
      abortController: null,
      isGenerating: false,
      error: pickLocale(get().locale, '生成已取消', 'Generation canceled'),
    })
    setTimeout(() => set({ error: null }), 3000)
  },

  generatedCode: '',
  setGeneratedCode: (code) => set({ generatedCode: code }),
  briefForm: DEFAULT_BRIEF_FORM,
  setBriefForm: (updates) => set({ briefForm: { ...get().briefForm, ...updates } }),
  generationTimeline: [],
  setGenerationTimeline: (steps) => set({ generationTimeline: steps }),
  activeGenerationLabel: null,
  setActiveGenerationLabel: (label) => set({ activeGenerationLabel: label }),

  showSettings: false,
  toggleSettings: () => set({ showSettings: !get().showSettings }),
  isPreviewFocused: false,
  setPreviewFocused: (focused) => set({ isPreviewFocused: focused }),
  togglePreviewFocus: () => set({ isPreviewFocused: !get().isPreviewFocused }),
  showSidebar: true,
  toggleSidebar: () => set({ showSidebar: !get().showSidebar }),

  error: null,
  setError: (error) => set({ error }),

  success: null,
  setSuccess: (msg) => set({ success: msg }),
}))
