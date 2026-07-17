import { create } from 'zustand'

export interface UIState {
  showSettings: boolean
  toggleSettings: () => void
  isPreviewFocused: boolean
  setPreviewFocused: (focused: boolean) => void
  togglePreviewFocus: () => void
  showSidebar: boolean
  toggleSidebar: () => void
  chatCollapsed: boolean
  toggleChatCollapsed: () => void
  error: string | null
  setError: (error: string | null) => void
  success: string | null
  setSuccess: (msg: string | null) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  showSettings: false,
  toggleSettings: () => set({ showSettings: !get().showSettings }),
  isPreviewFocused: false,
  setPreviewFocused: (focused) => set({ isPreviewFocused: focused }),
  togglePreviewFocus: () => set({ isPreviewFocused: !get().isPreviewFocused }),
  showSidebar: true,
  toggleSidebar: () => set({ showSidebar: !get().showSidebar }),
  chatCollapsed: false,
  toggleChatCollapsed: () => set({ chatCollapsed: !get().chatCollapsed }),
  error: null,
  setError: (error) => {
    set({ error })
    if (error) {
      setTimeout(() => {
        if (useUIStore.getState().error === error) set({ error: null })
      }, 6000)
    }
  },
  success: null,
  setSuccess: (msg) => set({ success: msg }),
}))
