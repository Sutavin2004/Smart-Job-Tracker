import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByToken, SESSION_COOKIE } from '@/lib/auth'
import { IS_DEMO } from '@/lib/demo'
import { AuthShell } from './AuthShell'
import { AuthForm } from './AuthForm'
import { GOOGLE_ENABLED } from '@/lib/google-oauth'

export { safeNext } from '@/lib/safe-next'
import { safeNext } from '@/lib/safe-next'

export async function AuthPage({ mode, searchParams }: { mode: 'login' | 'signup'; searchParams: Promise<{ next?: string | string[]; error?: string | string[] }> }) {
  const params = await searchParams
  const next = safeNext(params.next)
  const error = typeof params.error === 'string' ? params.error : undefined
  const user = await getUserByToken((await cookies()).get(SESSION_COOKIE)?.value)
  if (user) redirect(next)
  return (
    <AuthShell>
      <AuthForm mode={mode} next={next} demo={IS_DEMO} google={GOOGLE_ENABLED && !IS_DEMO} initialError={error} />
    </AuthShell>
  )
}
