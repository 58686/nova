/**
 * Command pattern implementation for undo/redo functionality.
 */

export interface Command {
  execute(): void
  undo(): void
  description: string
}

class CommandHistory {
  private history: Command[] = []
  private currentIndex: number = -1
  private readonly maxHistory: number = 50

  /**
   * Execute a command and add it to history.
   */
  execute(command: Command): void {
    // Remove any commands after current index (when undoing then doing something new)
    this.history = this.history.slice(0, this.currentIndex + 1)

    // Execute the command
    command.execute()

    // Add to history
    this.history.push(command)
    this.currentIndex++

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
      this.currentIndex--
    }
  }

  /**
   * Undo the last command.
   */
  undo(): boolean {
    if (!this.canUndo()) return false

    const command = this.history[this.currentIndex]
    command.undo()
    this.currentIndex--

    return true
  }

  /**
   * Redo the previously undone command.
   */
  redo(): boolean {
    if (!this.canRedo()) return false

    this.currentIndex++
    const command = this.history[this.currentIndex]
    command.execute()

    return true
  }

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * Get description of command that would be undone.
   */
  getUndoDescription(): string | null {
    if (!this.canUndo()) return null
    return this.history[this.currentIndex].description
  }

  /**
   * Get description of command that would be redone.
   */
  getRedoDescription(): string | null {
    if (!this.canRedo()) return null
    return this.history[this.currentIndex + 1].description
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * Get current history state for debugging.
   */
  getState(): { history: string[]; currentIndex: number } {
    return {
      history: this.history.map(cmd => cmd.description),
      currentIndex: this.currentIndex,
    }
  }
}

// Global command history instance
export const commandHistory = new CommandHistory()
