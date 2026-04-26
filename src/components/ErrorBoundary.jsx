import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <p className="text-white/20 font-sans text-xs uppercase tracking-[0.3em] mb-6">Unexpected Error</p>
            <h1 className="text-5xl font-sans font-light text-white mb-4">
              Something<br /><span className="font-serif italic">went wrong.</span>
            </h1>
            <p className="text-white/40 font-sans mb-10 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-8 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
