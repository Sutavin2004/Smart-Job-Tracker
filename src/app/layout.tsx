import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/Sidebar'
import { QueryProvider } from '@/components/QueryProvider'
import { CommandPalette } from '@/components/CommandPalette'
import { MobileNav } from '@/components/layout/MobileNav'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { FollowUpBanner } from '@/components/FollowUpBanner'
import { DemoBanner } from '@/components/DemoBanner'
import { IS_DEMO } from '@/lib/demo'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  title: { default: 'JobTrack — AI Job Search', template: '%s · JobTrack' },
  description: 'Track every application on a drag-and-drop board while an AI agent finds and scores jobs that fit you.',
  applicationName: 'JobTrack',
  appleWebApp: { capable: true, title: 'JobTrack', statusBarStyle: 'black-translucent' },
  openGraph: { type: 'website', siteName: 'JobTrack', title: 'JobTrack — AI Job Search', description: 'An AI agent that finds jobs that fit you, and a board to track every application.' },
  twitter: { card: 'summary_large_image' },
  // The personal app stays out of search engines; the public demo can be indexed.
  robots: IS_DEMO ? { index: true, follow: true } : { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0e1a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg">
              Skip to main content
            </a>
            <div className="flex h-screen flex-col">
            {IS_DEMO && <DemoBanner />}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <Sidebar />
              {/* tabIndex lets keyboard users scroll pages with no other focusable content */}
              <main id="main-content" tabIndex={0} className="flex-1 overflow-y-auto pb-16 md:pb-0 focus:outline-none">
                {children}
              </main>
            </div>
            </div>
            <MobileNav />
            <CommandPalette />
            <KeyboardShortcuts />
            <FollowUpBanner />
            <Toaster
              position="bottom-right"
              mobileOffset={{ bottom: 84 }}
              richColors
              toastOptions={{
                classNames: {
                  toast: 'dark:bg-slate-800 dark:text-white dark:border-slate-700',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
        {/* Vercel Web Analytics + Speed Insights (served by Vercel; no-ops locally) */}
        {process.env.VERCEL && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
        {process.env.VERCEL && <Script src="/_vercel/speed-insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  )
}
