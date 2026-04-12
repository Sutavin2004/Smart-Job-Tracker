import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/Sidebar'
import { QueryProvider } from '@/components/QueryProvider'

export const metadata: Metadata = {
  title: 'Smart Job Tracker',
  description: 'Track your job applications with AI-powered insights',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            <Toaster
              position="bottom-right"
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
