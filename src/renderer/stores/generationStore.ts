import { create } from 'zustand'
import type { BriefFormState, GenerationTimelineStep } from './appStore'

export const DEFAULT_BRIEF_FORM: BriefFormState = {
  product: '',
  audience: '',
  goal: '',
  sections: 'Hero, social proof, features, CTA',
  notes: '',
  directionId: 'editorial-premium',
  pageType: 'landing',
  outputLang: 'auto',
  darkMode: false,
  designSystemId: 'default',
}

export interface GenerationState {
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
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  isGenerating: false,
  setGenerating: (generating) => set({ isGenerating: generating }),

  abortController: null,
  setAbortController: (controller) => set({ abortController: controller }),
  cancelGeneration: () => {
    const { abortController } = get()
    if (!abortController) return
    abortController.abort()
    set({ abortController: null, isGenerating: false })
  },

  generatedCode: '',
  setGeneratedCode: (code) => set({ generatedCode: code }),

  briefForm: DEFAULT_BRIEF_FORM,
  setBriefForm: (updates) => set({ briefForm: { ...get().briefForm, ...updates } }),

  generationTimeline: [],
  setGenerationTimeline: (steps) => set({ generationTimeline: steps }),

  activeGenerationLabel: null,
  setActiveGenerationLabel: (label) => set({ activeGenerationLabel: label }),
}))
