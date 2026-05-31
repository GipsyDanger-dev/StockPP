import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--dark-bg)',
          color: '#fff',
          fontFamily: 'var(--font-ui, sans-serif)',
        }}>
          <div style={{ textAlign: 'center', padding: '40px', maxWidth: 460 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 24,
            }}>!</div>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 12 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginBottom: 28, lineHeight: 1.5 }}>
              An unexpected error occurred. Please try refreshing the page or return to the dashboard.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'var(--orange)', color: '#fff', border: 'none',
                  padding: '12px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
                style={{
                  background: 'transparent', color: 'var(--gray-mid)', border: '1px solid var(--dark-border)',
                  padding: '12px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
