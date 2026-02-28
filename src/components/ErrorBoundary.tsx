'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('客户端错误:', error)
    console.error('错误信息:', errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-red-500/30">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">应用程序错误</h2>
              <p className="text-gray-400 mb-4">客户端发生了异常错误</p>
              
              {this.state.error && (
                <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-sm text-red-400 font-mono mb-2">{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer mb-2">查看详细错误信息</summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-gray-950 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  刷新页面
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open('https://auto-intel-0226.vercel.app', '_blank')
                    }
                  }}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  访问 Vercel 版本
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  如果问题持续存在，请检查浏览器控制台获取更多信息 (F12 → Console)
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
