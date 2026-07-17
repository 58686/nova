import { Command } from './commandHistory'
import { useAppStore } from '../stores/appStore'
import type { Page, Project } from '../stores/appStore'

/**
 * Command to delete a page.
 * This is the main use case for undo/redo in the current app structure.
 */
export class DeletePageCommand implements Command {
  description: string
  private pageId: string
  private deletedPage: Page | null

  constructor(projectId: string, pageId: string) {
    this.pageId = pageId

    const store = useAppStore.getState()
    const project = store.projects.find(p => p.id === projectId)
    this.deletedPage = project?.pages?.find(p => p.id === pageId) || null
    this.description = `Delete page: ${this.deletedPage?.name || pageId}`
  }

  execute(): void {
    const store = useAppStore.getState()
    store.deletePage(this.pageId)
  }

  undo(): void {
    if (!this.deletedPage) return

    const store = useAppStore.getState()
    const currentProject = store.currentProject
    if (!currentProject) return

    const updatedPages = [...(currentProject.pages || []), this.deletedPage!]
    store.updateProject(currentProject.id, { pages: updatedPages })
    // Sync projectPages state — updateProject only updates projects/currentProject,
    // but deletePage had also set projectPages, so we must restore it here too.
    useAppStore.setState({ projectPages: updatedPages })
  }
}

/**
 * Command to update project name.
 */
export class UpdateProjectNameCommand implements Command {
  description: string
  private projectId: string
  private oldName: string
  private newName: string

  constructor(projectId: string, oldName: string, newName: string) {
    this.projectId = projectId
    this.oldName = oldName
    this.newName = newName
    this.description = `Rename project: "${oldName}" → "${newName}"`
  }

  execute(): void {
    const store = useAppStore.getState()
    store.updateProject(this.projectId, { name: this.newName })
  }

  undo(): void {
    const store = useAppStore.getState()
    store.updateProject(this.projectId, { name: this.oldName })
  }
}

/**
 * Command to delete a project.
 */
export class DeleteProjectCommand implements Command {
  description: string
  private projectId: string
  private deletedProject: Project | null

  constructor(projectId: string) {
    this.projectId = projectId

    const store = useAppStore.getState()
    this.deletedProject = store.projects.find(p => p.id === projectId) || null
    this.description = `Delete project: ${this.deletedProject?.name || projectId}`
  }

  execute(): void {
    const store = useAppStore.getState()
    store.deleteProject(this.projectId)
  }

  undo(): void {
    if (!this.deletedProject) return

    const store = useAppStore.getState()
    const projects = [...store.projects, this.deletedProject]

    useAppStore.setState({ projects })
    // Also need to restore to localStorage
    localStorage.setItem('nova-projects', JSON.stringify(projects))
  }
}
