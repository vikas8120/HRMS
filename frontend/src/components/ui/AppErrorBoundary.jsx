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
        <div className="panel error-banner" role="alert">
          <strong>Something went wrong while rendering this page.</strong>
          <div>{this.state.message}</div>
        </div>
      )
    }
    return this.props.children
  }
}

export default AppErrorBoundary
