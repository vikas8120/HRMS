import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles.css'

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement)

const renderFatal = (error) => {
  const message = error?.message || String(error) || 'Unknown startup error'
  root.render(
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h2>Frontend startup error</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
    </div>
  )
}

import('./App')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </React.StrictMode>
    )
  })
  .catch(renderFatal)
