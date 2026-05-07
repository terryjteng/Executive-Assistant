import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'
import './index.css'
import App from './App'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      clerkJSUrl="https://unpkg.com/@clerk/clerk-js@5/dist/clerk.browser.js"
    >
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-4">
                <img src="/kato8-icon.png" alt="Kato.8" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-white">Executive Assistant</h1>
              <p className="text-sm text-slate-400 mt-1">Kato.8 Studios — Private access only</p>
            </div>
            <SignIn routing="hash" appearance={{
              elements: {
                card: 'shadow-sm border border-slate-800 rounded-2xl bg-slate-900',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
              }
            }} />
          </div>
        </div>
      </SignedOut>
    </ClerkProvider>
  </StrictMode>,
)
