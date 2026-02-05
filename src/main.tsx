import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { ThemeProvider } from './context/ThemeContext.tsx'
import NotifyComponent from './Notify/NotifyComponent.tsx'

  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
      <ClerkProvider afterSignOutUrl="/auth" signInForceRedirectUrl="/dashboard/selector" publishableKey={PUBLISHABLE_KEY} appearance={{
        theme: dark,}}>
        <NotifyComponent>
        <App />

        </NotifyComponent>
      </ClerkProvider>
       </ThemeProvider>
    </StrictMode>,
  )