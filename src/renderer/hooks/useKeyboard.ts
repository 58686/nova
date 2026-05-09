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
]
