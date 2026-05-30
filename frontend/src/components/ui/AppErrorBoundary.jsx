import { Component } from 'react'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error' }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('AppErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            margin: 16,
            padding: 16,
            borderRadius: 12,
            border: '2px solid #ef4444',
            background: '#fff1f2',
            color: '#111827',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            lineHeight: 1.4
          }}
        >
          <strong style={{ display: 'block', marginBottom: 8 }}>Something went wrong while rendering this page.</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{this.state.message}</div>
        </div>
      )
    }
    return this.props.children
  }
}

export default AppErrorBoundary
