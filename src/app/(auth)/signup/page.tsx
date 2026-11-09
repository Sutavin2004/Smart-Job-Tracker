import type { Metadata } from 'next'
import { AuthPage } from '@/components/auth/auth-page'

export const metadata: Metadata = { title: 'Create an account' }
export const dynamic = 'force-dynamic'

export default function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  return <AuthPage mode="signup" searchParams={searchParams} />
}
