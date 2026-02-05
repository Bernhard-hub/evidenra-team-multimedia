import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ============================================
// ERROR TRACKING - Tracks last click before error
// ============================================
const errorTracker = {
  lastClick: null as {
    element: string
    text: string
    path: string
    timestamp: Date
  } | null,

  init() {
    // Track all clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const path: string[] = []
      let el: HTMLElement | null = target

      // Build element path
      while (el && el !== document.body) {
        let selector = el.tagName.toLowerCase()
        if (el.id) selector += `#${el.id}`
        if (el.className && typeof el.className === 'string') {
          selector += '.' + el.className.split(' ').filter(c => c && !c.includes('/')).slice(0, 2).join('.')
        }
        path.unshift(selector)
        el = el.parentElement
      }

      this.lastClick = {
        element: target.tagName,
        text: (target.textContent || '').slice(0, 50).trim(),
        path: path.slice(-3).join(' > '),
        timestamp: new Date()
      }
    }, true)

    // Enhanced error handler
    const originalOnError = window.onerror
    window.onerror = (msg, url, line, col, error) => {
      console.group('🔴 ERROR DETAILS')
      console.error('Message:', msg)
      console.error('Location:', `${url}:${line}:${col}`)
      if (this.lastClick) {
        console.log('📍 Last Click:', {
          element: this.lastClick.element,
          text: this.lastClick.text,
          path: this.lastClick.path,
          when: this.lastClick.timestamp.toLocaleTimeString()
        })
      }
      console.groupEnd()

      if (originalOnError) {
        return originalOnError.call(window, msg, url, line, col, error)
      }
      return false
    }

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      console.group('🔴 UNHANDLED PROMISE REJECTION')
      console.error('Reason:', e.reason)
      if (this.lastClick) {
        console.log('📍 Last Click:', {
          element: this.lastClick.element,
          text: this.lastClick.text,
          path: this.lastClick.path,
          when: this.lastClick.timestamp.toLocaleTimeString()
        })
      }
      console.groupEnd()
    })

    console.log('✅ Error tracker initialized - click info will appear with errors')
  }
}

// Initialize error tracking
errorTracker.init()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Hide initial loader after a short delay to ensure smooth transition
const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader')
  if (loader) {
    loader.classList.add('fade-out')
    setTimeout(() => {
      loader.style.display = 'none'
    }, 300)
  }
}

// Render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

// Hide loader after React has mounted
setTimeout(hideInitialLoader, 100)
