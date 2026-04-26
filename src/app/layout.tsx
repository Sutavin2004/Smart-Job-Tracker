import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/Sidebar'
import { QueryProvider } from '@/components/QueryProvider'
import { CommandPalette } from '@/components/CommandPalette'
import { MobileNav } from '@/components/layout/MobileNav'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'

export const metadata: Metadata = {
  title: 'JobTrack — AI Job Search',
  description: 'AI-powered job application tracker with automated job discovery',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
      </body>
    </html>
  )
}
