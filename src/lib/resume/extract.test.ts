import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractResumeText, detectKind, tidy, UnsupportedFileError } from './extract'

const fixture = (n: string) => new Uint8Array(readFileSync(join(__dirname, 'fixtures', n)))

describe('extractResumeText', () => {
  it('reads a PDF', async () => {
    const text = await extractResumeText('cv.pdf', fixture('sample.pdf'))
    expect(text).toContain('Jordan Lee')
    expect(text).toContain('Reduced build time by 60%')
  })
  it('reads a Word document', async () => {
    const text = await extractResumeText('cv.docx', fixture('sample.docx'))
    expect(text).toContain('Built a React dashboard used by 40 teams')
  })
  it('reads plain text', async () => {
    const t = 'Jordan Lee\nSoftware developer with five years of React and Node experience.'
    expect(await extractResumeText('cv.txt', new TextEncoder().encode(t))).toBe(t)
  })
  it('detects type from content, not the file name', () => {
    expect(detectKind('cv.docx', fixture('sample.pdf'))).toBe('pdf')
    expect(detectKind('photo.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
  })
  it('rejects other files and near-empty ones', async () => {
    await expect(extractResumeText('photo.png', new Uint8Array([0x89, 0x50]))).rejects.toBeInstanceOf(UnsupportedFileError)
    await expect(extractResumeText('a.txt', new TextEncoder().encode('hi'))).rejects.toBeInstanceOf(UnsupportedFileError)
  })
  it('tidies spacing', () => {
    expect(tidy('a  b\t c\r\n\n\n\nd ')).toBe('a b c\n\nd')
  })
})
