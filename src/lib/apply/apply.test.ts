import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { parseKit } from './kit'
import { resumeDocx, letterDocx, fileSafe } from './docx'

const RESUME = `Jordan Lee
jordan@example.com | 416-555-0100 | linkedin.com/in/jordan

SUMMARY
Frontend developer focused on accessible React apps.

EXPERIENCE
Software Developer, Northwind (2024–2026)
- Built a React dashboard used by 40 teams
- Cut page load time by 60% with code splitting

EDUCATION
B.Sc., Western University`

describe('parseKit', () => {
  it('reads a well-formed reply, even with text around the JSON', () => {
    const kit = parseKit(`Here you go:\n${JSON.stringify({
      tailoredResume: RESUME, coverLetter: 'Dear team', answers: [{ question: 'Why?', answer: 'Because.' }, { bad: 1 }],
      matchedKeywords: ['React', 3], missingKeywords: ['GraphQL'], notes: ['No GraphQL experience shown'],
    })}\nThanks`)
    expect(kit?.tailoredResume).toContain('Northwind')
    expect(kit?.answers).toEqual([{ question: 'Why?', answer: 'Because.' }])
    expect(kit?.matchedKeywords).toEqual(['React'])
    expect(kit?.notes).toHaveLength(1)
  })
  it('rejects replies without a usable résumé', () => {
    expect(parseKit('no json here')).toBeNull()
    expect(parseKit('{"tailoredResume": "too short"}')).toBeNull()
    expect(parseKit('{"tailoredResume": ')).toBeNull()
  })
})

describe('Word export', () => {
  const textOf = async (buf: Buffer) => {
    const zip = await JSZip.loadAsync(buf)
    return (await zip.file('word/document.xml')!.async('string'))
  }
  it('builds a résumé with the name, headings and bullets', async () => {
    const xml = await textOf(await resumeDocx(RESUME))
    expect(xml).toContain('Jordan Lee')
    expect(xml).toContain('EXPERIENCE')
    expect(xml).toContain('Built a React dashboard used by 40 teams')
    expect(xml).not.toContain('- Built') // bullet markers become real bullets
    expect(xml).toContain('<w:numPr>')
  })
  it('builds a cover letter with one paragraph per block', async () => {
    const xml = await textOf(await letterDocx('Dear team,\n\nFirst paragraph.\n\nJordan'))
    expect((xml.match(/<w:p>|<w:p /g) ?? []).length).toBeGreaterThanOrEqual(3)
  })
  it('makes safe file names', () => {
    expect(fileSafe('Harbor & Pine, Inc.')).toBe('Harbor-Pine-Inc')
    expect(fileSafe('***')).toBe('file')
  })
})
