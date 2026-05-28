import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'

export function useKeyboard() {
  const {
    toggleSettings,
    toggleSidebar,
    cancelGeneration,
    isGenerating,
    showSettings,
    togglePreviewFocus,
    versions,
    activeVersionId,
    restoreVersion,
  } = useAppStore()

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
        // Only undo if not in a text input/textarea
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          const idx = versions.findIndex(v => v.id === activeVersionId)
          if (idx > 0) restoreVersion(versions[idx - 1].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSettings, toggleSidebar, cancelGeneration, isGenerating, showSettings, togglePreviewFocus, versions, activeVersionId, restoreVersion])
}

export const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Send / generate' },
  { keys: ['Ctrl', 'K'], description: 'Focus input' },
  { keys: ['Ctrl', ','], description: 'Open settings' },
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
  { keys: ['Ctrl', 'P'], description: 'Focus preview' },
  { keys: ['Esc'], description: 'Cancel / close' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last version' },
]
