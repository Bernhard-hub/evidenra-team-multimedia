import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

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
