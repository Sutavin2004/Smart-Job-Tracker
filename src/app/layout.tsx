import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import '@fontsource-variable/instrument-sans'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/QueryProvider'
import { IS_DEMO } from '@/lib/demo'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  title: { default: 'JobTrack', template: '%s | JobTrack' },
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
    { media: '(prefers-color-scheme: light)', color: '#F7F7F5' },
    { media: '(prefers-color-scheme: dark)', color: '#121314' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            {children}
            <Toaster
              position="bottom-right"
              mobileOffset={{ bottom: 84 }}
              toastOptions={{
                classNames: {
                  toast: 'font-sans dark:bg-[#1A1B1D] dark:text-white dark:border-[#2A2B2E]',
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
