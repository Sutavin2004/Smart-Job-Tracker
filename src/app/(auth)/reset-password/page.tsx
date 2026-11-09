import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/AuthShell'
import { ResetForm } from '@/components/auth/ResetForms'

export const metadata: Metadata = { title: 'Choose a new password' }
export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return <AuthShell><ResetForm token={typeof token === 'string' ? token : ''} /></AuthShell>
}
