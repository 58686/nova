import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label ?? 'Panel', error, info.componentStack)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          className="shell-panel flex flex-col items-center justify-center gap-3 rounded-[26px] p-8 text-center"
          style={{ minHeight: 200 }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {this.props.label ?? 'Panel'} crashed
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <button className="btn btn-ghost text-xs" onClick={this.reset}>
            Reload panel
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
