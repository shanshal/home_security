import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-3xl p-4">
          <div className="alert alert-error">
            <span className="text-sm">{String(this.state.error.message || this.state.error)}</span>
          </div>
          <pre className="mt-3 text-xs overflow-auto p-3 rounded bg-base-200">
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

