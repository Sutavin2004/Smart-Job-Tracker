export interface ApplicationKit {
  tailoredResume: string
  coverLetter: string
  answers: { question: string; answer: string }[]
  matchedKeywords: string[]
  missingKeywords: string[]
  notes: string[] // honest gaps the user should know about
}


/** Pull the first JSON object out of a model reply. */
export function parseKit(text: string): ApplicationKit | null {
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return null
  try {
    const o = JSON.parse(json) as Partial<ApplicationKit>
    if (typeof o.tailoredResume !== 'string' || o.tailoredResume.trim().length < 100) return null
    const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
    return {
      tailoredResume: o.tailoredResume.trim(),
      coverLetter: typeof o.coverLetter === 'string' ? o.coverLetter.trim() : '',
      answers: Array.isArray(o.answers)
        ? o.answers.filter(a => a && typeof a.question === 'string' && typeof a.answer === 'string').slice(0, 8)
        : [],
      matchedKeywords: strings(o.matchedKeywords).slice(0, 20),
      missingKeywords: strings(o.missingKeywords).slice(0, 20),
      notes: strings(o.notes).slice(0, 6),
    }
  } catch {
    return null
  }
}

