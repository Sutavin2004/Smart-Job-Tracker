import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { MobileNav } from '@/components/layout/MobileNav'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { FollowUpBanner } from '@/components/FollowUpBanner'
import { DemoBanner } from '@/components/DemoBanner'
import { SessionWatcher } from '@/components/SessionWatcher'
import { getUserByToken, SESSION_COOKIE } from '@/lib/auth'
import { IS_DEMO } from '@/lib/demo'

// Every page in this group needs a signed-in user, checked against the database.
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const user = await getUserByToken(token)
  if (!user) redirect('/login')

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-panel">
        Skip to main content
      </a>
      <div className="flex h-screen flex-col">
        {IS_DEMO && <DemoBanner />}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar user={{ name: user.name, email: user.email }} demo={IS_DEMO} />
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
      <SessionWatcher />
    </>
  )
}
