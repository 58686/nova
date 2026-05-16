import { useMemo, useState } from 'react'
import { Locale, pickLocale } from '../locale'
import { useLocale } from '../hooks/useLocale'
import { useAppStore } from '../stores/appStore'

function timeAgo(timestamp: number, locale: Locale): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return pickLocale(locale, '刚刚更新', 'Updated just now')
  if (minutes < 60) return pickLocale(locale, `${minutes} 分钟前`, `${minutes} min ago`)
  if (hours < 24) return pickLocale(locale, `${hours} 小时前`, `${hours} hr ago`)
  if (days === 1) return pickLocale(locale, '昨天', 'Yesterday')
  if (days < 7) return pickLocale(locale, `${days} 天前`, `${days} days ago`)

  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(timestamp)
}

export default function Sidebar() {
  const { projects, currentProject, setCurrentProject, deleteProject, addProject, showSidebar, setSuccess } = useAppStore()
  const { locale, text } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [projects, searchQuery],
  )

  if (!showSidebar) return null

  const handleNewProject = () => {
    addProject({
      name: text(`设计草稿 ${projects.length + 1}`, `Design Draft ${projects.length + 1}`),
      description: '',
      code: '',
    })
    setSuccess(text('已创建新项目', 'New project created'))
  }

  return (
    <aside className="shell-panel flex h-full w-full flex-col overflow-hidden rounded-[28px]">
      <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            {text('工作区', 'Workspace')}
          </p>
          <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {text('项目', 'Projects')}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {text('把提示词、生成页面、版本和测试都放在一个地方管理。', 'Keep your prompts, generated pages, versions, and tests in one place.')}
          </p>
        </div>

        <button className="btn btn-primary w-full" onClick={handleNewProject}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
          </svg>
          {text('新建项目', 'New Project')}
        </button>

        <div className="mt-4">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-disabled)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
            <input
              className="input h-11 pl-10 pr-4"
              placeholder={text('搜索项目', 'Search projects')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filteredProjects.length === 0 ? (
          <div className="panel-card flex h-full flex-col items-center justify-center rounded-[24px] p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px]" style={{ background: 'var(--bg-accent-soft)' }}>
              <svg className="h-8 w-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {searchQuery ? text('没有匹配项目', 'No matching project') : text('还没有项目', 'No project yet')}
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery
                ? text('换个关键词试试，或者新建一个草稿。', 'Try a different keyword or create a new draft.')
                : text('创建第一个项目后，就可以开始生成页面。', 'Create your first project to start generating pages.')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => {
              const isActive = currentProject?.id === project.id

              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  className="panel-card group w-full cursor-pointer rounded-[22px] p-4 text-left transition-all duration-200"
                  onClick={() => setCurrentProject(project)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setCurrentProject(project)
                    }
                  }}
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.86)' : 'var(--bg-surface)',
                    borderColor: isActive ? 'var(--border-accent)' : 'var(--border-subtle)',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: isActive ? 'var(--accent)' : 'rgba(142, 125, 118, 0.45)' }}
                        />
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {project.name}
                        </p>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(project.updatedAt, locale)}
                      </p>
                    </div>

                    {showDeleteConfirm === project.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="rounded-full px-3 py-1 text-xs"
                          style={{ background: 'rgba(203, 111, 111, 0.14)', color: 'var(--danger)' }}
                          onClick={(event) => {
                            event.stopPropagation()
                            deleteProject(project.id)
                            setShowDeleteConfirm(null)
                            setSuccess(text('项目已删除', 'Project deleted'))
                          }}
                        >
                          {text('删除', 'Delete')}
                        </button>
                        <button
                          className="rounded-full px-3 py-1 text-xs"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                          onClick={(event) => {
                            event.stopPropagation()
                            setShowDeleteConfirm(null)
                          }}
                        >
                          {text('取消', 'Cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-icon h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation()
                          setShowDeleteConfirm(project.id)
                        }}
                        title={text('删除项目', 'Delete project')}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7 18.133 19.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>{text('项目总数', 'Total projects')}</span>
          <span className="badge badge-accent">{projects.length}</span>
        </div>
      </div>
    </aside>
  )
}
