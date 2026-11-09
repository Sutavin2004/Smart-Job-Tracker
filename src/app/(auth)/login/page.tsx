import type { Metadata } from 'next'
import { AuthPage } from '@/components/auth/auth-page'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  return <AuthPage mode="login" searchParams={searchParams} />
}
