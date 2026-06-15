import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { commandHistory } from '../services/commandHistory'

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
        // Undo command
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          commandHistory.undo()
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
  }, [toggleSettings, toggleSidebar, cancelGeneration, isGenerating, showSettings, togglePreviewFocus, versions, activeVersionId, restoreVersion])
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
