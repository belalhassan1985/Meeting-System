'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error but don't crash the app
    console.warn('LiveKit UI Error (non-critical):', error.message)
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or just continue rendering children
      return this.props.fallback || this.props.children
    }

    return this.props.children
  }
}
