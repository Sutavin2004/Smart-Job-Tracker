/** Turn an uploaded résumé (PDF, DOCX or plain text) into plain text. */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024

export class UnsupportedFileError extends Error {}

type Kind = 'pdf' | 'docx' | 'text'

export function detectKind(name: string, bytes: Uint8Array): Kind | null {
  // Trust the file's first bytes over its name.
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf' // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && /\.docx$/i.test(name)) return 'docx'                  // zip
  if (/\.(txt|md)$/i.test(name)) return 'text'
  return null
}

/** Collapse the spacing PDF extraction leaves behind, keeping paragraph breaks. */
export function tidy(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractResumeText(name: string, bytes: Uint8Array): Promise<string> {
  const kind = detectKind(name, bytes)
  if (!kind) throw new UnsupportedFileError('Upload a PDF, Word (.docx) or text file.')
  let text: string
  if (kind === 'pdf') {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(bytes)
    const out = await extractText(pdf, { mergePages: true })
    text = Array.isArray(out.text) ? out.text.join('\n') : out.text
  } else if (kind === 'docx') {
    const mammoth = await import('mammoth')
    const out = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
    text = out.value
  } else {
    text = new TextDecoder().decode(bytes)
  }
  text = tidy(text)
  if (text.length < 40) {
    throw new UnsupportedFileError(kind === 'pdf'
      ? 'No text found in that PDF. If it is a scan, export it from Word or Google Docs as a PDF and try again.'
      : 'That file looks empty.')
  }
  return text.slice(0, 50_000)
}
