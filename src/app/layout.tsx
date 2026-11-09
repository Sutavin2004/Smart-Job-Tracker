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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  title: { default: 'JobTrack — AI Job Search', template: '%s · JobTrack' },
  description: 'Track every application on a drag-and-drop board while an AI agent finds and scores jobs that fit you.',
  applicationName: 'JobTrack',
  appleWebApp: { capable: true, title: 'JobTrack', statusBarStyle: 'black-translucent' },
  openGraph: { type: 'website', siteName: 'JobTrack', title: 'JobTrack — AI Job Search', description: 'An AI agent that finds jobs that fit you, and a board to track every application.' },
  twitter: { card: 'summary_large_image' },
  robots: { index: false, follow: false }, // personal app: keep it out of search engines
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
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {children}
              </main>
            </div>
            <MobileNav />
            <CommandPalette />
            <KeyboardShortcuts />
            <FollowUpBanner />
            <Toaster
              position="bottom-right"
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
