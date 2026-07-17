import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../stores/appStore'
import { useUIStore } from '../stores/uiStore'
import { useGenerationStore } from '../stores/generationStore'
import { commandHistory } from '../services/commandHistory'

export function useKeyboard() {
  const {
    toggleSettings,
    showSettings,
    toggleSidebar,
    togglePreviewFocus,
  } = useUIStore(useShallow(s => ({
    toggleSettings: s.toggleSettings,
    showSettings: s.showSettings,
    toggleSidebar: s.toggleSidebar,
    togglePreviewFocus: s.togglePreviewFocus,
  })))
  const { isGenerating, cancelGeneration } = useGenerationStore(useShallow(s => ({
    isGenerating: s.isGenerating,
    cancelGeneration: s.cancelGeneration,
  })))

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        const input = document.querySelector('textarea')
        if (input instanceof HTMLElement) {
          input.focus()
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault()
        toggleSettings()
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        toggleSidebar()
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault()
        togglePreviewFocus()
      }

      if (event.key === 'Escape') {
        if (showSettings) {
          toggleSettings()
        } else if (isGenerating) {
          cancelGeneration()
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        // Undo: prefer command history, fall back to version history
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          if (commandHistory.canUndo()) {
            commandHistory.undo()
          } else {
            // Fall back to version history: restore the previous version
            const { versions, activeVersionId, restoreVersion } = useAppStore.getState()
            if (versions.length > 0 && activeVersionId) {
              const idx = versions.findIndex(v => v.id === activeVersionId)
              if (idx > 0) {
                restoreVersion(versions[idx - 1].id)
              }
            }
          }
        }
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        // Redo command (Ctrl+Y or Ctrl+Shift+Z)
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          commandHistory.redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSettings, toggleSidebar, cancelGeneration, isGenerating, showSettings, togglePreviewFocus])
}

export const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Send / generate' },
  { keys: ['Ctrl', 'K'], description: 'Focus input' },
  { keys: ['Ctrl', ','], description: 'Open settings' },
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
  { keys: ['Ctrl', 'P'], description: 'Focus preview' },
  { keys: ['Esc'], description: 'Cancel / close' },
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Y'], description: 'Redo' },
]
