import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from '@/lib/ai-models'
import type { ScopedDb } from '@/lib/scoped-db'
import { NotFoundError } from '@/lib/scoped-db'
import { parseKit, type ApplicationKit } from './kit'

export type { ApplicationKit }

export class KitUnavailableError extends Error {}

const QUESTIONS = [
  'Why do you want to work here?',
  'Why are you a good fit for this role?',
  'Tell us about a relevant project or accomplishment.',
  'What are your salary expectations?',
]

/**
 * Write a tailored résumé, cover letter and answers to common questions for one
 * job, and save them on the job. Uses only facts already in the user's résumé.
 */
export async function prepareApplication(db: ScopedDb, jobId: string): Promise<ApplicationKit> {
  if (!process.env.ANTHROPIC_API_KEY) throw new KitUnavailableError('AI features are not set up on this site.')
  const [job, profile] = await Promise.all([
    db.job.findUnique({ where: { id: jobId } }),
    db.userProfile.findFirst(),
  ])
  if (!job) throw new NotFoundError('Job not found')
  const resume = profile?.masterResume?.trim()
  if (!resume || resume.length < 200) {
    throw new KitUnavailableError('Add your full résumé on the Résumé page first. The tailored version is built from it.')
  }

  const salary = profile?.targetSalaryMin
    ? `${profile.targetSalaryMin}k–${profile.targetSalaryMax || profile.targetSalaryMin}k ${profile.currency}`
    : 'not provided'

  const prompt = `You are preparing a job application for a real candidate. Accuracy matters more than polish.

RULES
- Use ONLY facts in the candidate's résumé and profile. Never invent employers, titles, dates, degrees, tools, numbers or achievements.
- You may reorder sections, choose which bullets to keep, rewrite bullets to use the posting's language where the meaning is the same, and write a short summary at the top.
- If the posting asks for something the candidate doesn't show, do not add it. List it under "notes" instead.
- Write the notes directly to the candidate in second person ("Your résumé doesn't show AWS…"). Don't ask them to confirm dates or facts that the résumé states plainly; only flag real gaps and real risks.
- Keep the résumé to what fits on one or two pages. Plain text. Put section headings on their own line in capitals (e.g. EXPERIENCE). Start bullets with "- ".
- The cover letter: 3 short paragraphs, under 250 words, specific to this company and role, no clichés like "I am writing to express my interest". Sign with the candidate's name.
- Answers: 2–5 sentences each, first person, based on real résumé content. For salary, use the candidate's target if given, otherwise say they are flexible and want to learn more about the range.

JOB
Company: ${job.company}
Role: ${job.role}
Location: ${job.location ?? 'not given'}
Posting:
${(job.jobDescription ?? 'No description saved. Tailor to the role title and company.').slice(0, 12000)}

CANDIDATE
Name: ${profile?.name || 'the candidate'}
Email: ${profile?.email || ''}
Phone: ${profile?.phone || ''}
Links: ${[profile?.linkedin, profile?.github, profile?.portfolio].filter(Boolean).join(' | ')}
Target salary: ${salary}
Summary from profile: ${profile?.bio ?? ''}

RÉSUMÉ
${resume.slice(0, 15000)}

Return ONLY a JSON object:
{
  "tailoredResume": "the full tailored résumé as plain text",
  "coverLetter": "the cover letter",
  "answers": [${QUESTIONS.map(q => `{"question": ${JSON.stringify(q)}, "answer": "..."}`).join(', ')}],
  "matchedKeywords": ["posting keywords the résumé already covers"],
  "missingKeywords": ["important posting keywords the résumé does not cover"],
  "notes": ["honest gaps or things to double-check before applying, written to the candidate as \"you\" and \"your résumé\" (never \"the candidate\"), one short sentence or two each"]
}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await anthropic.messages.create({
    model: AI_MODELS.write,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
  const kit = parseKit(text)
  if (!kit) throw new Error('The AI reply could not be read. Try again.')

  const version = `kit-${Date.now()}`
  // Replace any earlier kit so the job always shows the latest one.
  await db.document.updateMany({ where: { jobId, type: { in: ['resume', 'cover_letter', 'kit_notes'] } }, data: { isActive: false } })
  await db.document.create({
    data: { jobId, type: 'kit_notes', name: 'Application notes', content: JSON.stringify({ notes: kit.notes, matchedKeywords: kit.matchedKeywords, missingKeywords: kit.missingKeywords }), version, isActive: true },
  })
  await db.document.create({ data: { jobId, type: 'resume', name: `Résumé for ${job.company}`, content: kit.tailoredResume, version, isActive: true } })
  if (kit.coverLetter) {
    await db.document.create({ data: { jobId, type: 'cover_letter', name: `Cover letter for ${job.company}`, content: kit.coverLetter, version, isActive: true } })
  }
  await db.applicationQA.deleteMany({ where: { jobId, approved: false } })
  if (kit.answers.length) await db.applicationQA.createMany({ data: kit.answers.map(a => ({ jobId, question: a.question, answer: a.answer })) })
  await db.job.update({
    where: { id: jobId },
    data: {
      applicationPreparedAt: new Date(),
      resumeVersion: version,
      coverLetter: kit.coverLetter || undefined,
    },
  })
  await db.activity.create({ data: { jobId, type: 'document_added', message: 'Application prepared: tailored résumé, cover letter and answers' } })
  return kit
}
