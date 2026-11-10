import { prisma } from './prisma'
import { sendEmail, layout, appUrl, escapeHtml } from './email'

/** Email the jobs a scheduled run just added, if the user asked for it and confirmed their address. */
export async function sendDigest(userId: string, sessionId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: { select: { emailDigest: true } } } })
  if (!user?.profile?.emailDigest || !user.emailVerifiedAt) return false
  const jobs = await prisma.job.findMany({
    where: { userId, agentSessionId: sessionId },
    orderBy: { aiScore: 'desc' },
    select: { id: true, company: true, role: true, location: true, aiScore: true, applicationPreparedAt: true },
    take: 15,
  })
  if (jobs.length === 0) return false

  const base = appUrl()
  const n = jobs.length
  const line = (j: typeof jobs[number]) => `${j.company}, ${j.role}${j.location ? ` (${j.location})` : ''}${j.aiScore != null ? `, fit ${j.aiScore}/100` : ''}`
  const rows = jobs.map(j => `<tr>
<td style="padding:10px 0;border-top:1px solid #E4E4E7;font-size:14px;line-height:1.4"><a href="${base}/jobs?id=${j.id}" style="color:#18181B;font-weight:600;text-decoration:none">${escapeHtml(j.company)}</a><br><span style="color:#63636B">${escapeHtml(j.role)}${j.location ? `, ${escapeHtml(j.location)}` : ''}</span>${j.applicationPreparedAt ? '<br><span style="color:#1D6B57;font-size:13px">Tailored résumé and cover letter ready</span>' : ''}</td>
<td style="padding:10px 0 10px 12px;border-top:1px solid #E4E4E7;font-size:14px;color:#1D6B57;text-align:right;white-space:nowrap">${j.aiScore != null ? `${j.aiScore}/100` : ''}</td></tr>`).join('')

  return sendEmail({
    to: user.email,
    subject: `${n} new ${n === 1 ? 'job' : 'jobs'} on your board`,
    text: `This morning's search added ${n} ${n === 1 ? 'job' : 'jobs'} to your board:\n\n${jobs.map(line).join('\n')}\n\nReview and apply: ${base}/apply\n\nTurn these emails off in Settings: ${base}/settings`,
    html: layout({
      heading: `${n} new ${n === 1 ? 'job' : 'jobs'} on your board`,
      paragraphs: ["This morning's search added these, best fit first."],
      extraHtml: `<table style="width:100%;border-collapse:collapse;margin:0 0 14px">${rows}</table>`,
      button: { label: 'Review and apply', url: `${base}/apply` },
      footer: `You get this because you turned on job emails. <a href="${base}/settings" style="color:#63636B">Turn them off in Settings</a>.`,
    }),
  })
}
