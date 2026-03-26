import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <section className="chart-card">
            <div className="section-header">
              <h3>Something went wrong</h3>
              <p>
                The UI crashed while rendering this page. Check the browser console for details.
              </p>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </section>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

