import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-title">something broke</div>
          <div className="error-boundary-sub">
            try reloading the page — your logged vibes are safe in the database.
          </div>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
