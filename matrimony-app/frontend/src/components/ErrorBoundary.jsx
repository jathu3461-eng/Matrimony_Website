import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fff5f7 0%, #fce7f3 100%)',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💔</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#be185d', marginBottom: '0.5rem' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px' }}>
            We're sorry for the inconvenience. Please refresh the page or try again.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Go to Home Page
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#fee2e2',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              color: '#991b1b',
              maxWidth: '600px',
              overflow: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
