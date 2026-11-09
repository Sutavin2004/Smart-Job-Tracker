import { sendEmail, layout, appUrl, escapeHtml } from './email'
import { issueToken } from './auth-tokens'

export async function sendPasswordReset(user: { id: string; email: string; name: string }) {
  const url = `${appUrl()}/reset-password?token=${await issueToken(user.id, 'reset')}`
  return sendEmail({
    to: user.email,
    subject: 'Reset your JobTrack password',
    text: `Use this link to choose a new password. It works once and expires in an hour.\n\n${url}\n\nIf you didn't ask for this, ignore this email; your password hasn't changed.`,
    html: layout({
      heading: 'Reset your password',
      paragraphs: [`Hi ${escapeHtml(user.name || 'there')}, use the button below to choose a new password. The link works once and expires in an hour.`],
      button: { label: 'Choose a new password', url },
      footer: "If you didn't ask for this, you can ignore this email. Your password hasn't changed.",
    }),
  })
}

export async function sendVerification(user: { id: string; email: string; name: string }) {
  const url = `${appUrl()}/api/auth/verify?token=${await issueToken(user.id, 'verify')}`
  return sendEmail({
    to: user.email,
    subject: 'Confirm your email for JobTrack',
    text: `Confirm this is your email address so JobTrack can send password resets and job digests:\n\n${url}\n\nThe link expires in 7 days.`,
    html: layout({
      heading: 'Confirm your email',
      paragraphs: ['Confirm this is your address so we can send password resets and, if you turn it on, a short email when the job agent finds new matches.'],
      button: { label: 'Confirm email', url },
      footer: "If you didn't create a JobTrack account, you can ignore this email.",
    }),
  })
}
