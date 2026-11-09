import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByToken, SESSION_COOKIE } from '@/lib/auth'
import { IS_DEMO } from '@/lib/demo'
import { AuthShell } from './AuthShell'
import { AuthForm } from './AuthForm'

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(raw: string | string[] | undefined) {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/'
}

export async function AuthPage({ mode, searchParams }: { mode: 'login' | 'signup'; searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNext((await searchParams).next)
  const user = await getUserByToken((await cookies()).get(SESSION_COOKIE)?.value)
  if (user) redirect(next)
  return (
    <AuthShell>
      <AuthForm mode={mode} next={next} demo={IS_DEMO} />
    </AuthShell>
  )
}
