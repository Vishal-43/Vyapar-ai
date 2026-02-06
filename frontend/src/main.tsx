import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { NotifyProvider } from './context/NotifyContext.tsx'

// Import and register service worker for PWA functionality
import { registerSW } from 'virtual:pwa-register'

// Register service worker with update handling
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    // console.log('App ready to work offline')
  },
  onRegistered(registration) {
    // console.log('Service Worker registered successfully')
  },
  onRegisterError(error) {
    console.error('Service Worker registration failed:', error)
  },
})

  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
      <ClerkProvider afterSignOutUrl="/auth" signInForceRedirectUrl="/dashboard/selector" publishableKey={PUBLISHABLE_KEY} appearance={{
        theme: dark,}}>
        <NotifyProvider>
        <App />

        </NotifyProvider>
      </ClerkProvider>
       </ThemeProvider>
    </StrictMode>,
  )