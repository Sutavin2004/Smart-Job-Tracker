import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/AuthShell'
import { ForgotForm } from '@/components/auth/ResetForms'
import { EMAIL_ENABLED } from '@/lib/email'
import { IS_DEMO } from '@/lib/demo'

export const metadata: Metadata = { title: 'Reset your password' }
export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return <AuthShell><ForgotForm enabled={EMAIL_ENABLED && !IS_DEMO} /></AuthShell>
}
