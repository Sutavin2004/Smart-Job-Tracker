import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx'

const FONT = 'Calibri'
const isHeading = (line: string) => /^[A-Z][A-Z &/,'()-]{2,40}:?$/.test(line.trim())
const bullet = (line: string) => line.match(/^\s*(?:[-•*▪●]|\d+\.)\s+(.*)$/)?.[1]

/** Turn the plain-text résumé the AI writes into a clean, ATS-friendly Word file. */
export function resumeDocx(text: string): Promise<Buffer> {
  const lines = text.replace(/\r/g, '').split('\n')
  const first = lines.findIndex(l => l.trim())
  const children: Paragraph[] = []

  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    if (!line.trim()) return
    if (i === first) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: line.trim(), bold: true, size: 32, font: FONT })] }))
      return
    }
    // Contact line(s) right under the name.
    if (i <= first + 2 && !isHeading(line) && /@|\||linkedin|github|\+?\d[\d\s().-]{6,}/i.test(line)) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: line.trim(), size: 19, font: FONT })] }))
      return
    }
    if (isHeading(line)) {
      children.push(new Paragraph({
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 2 } },
        children: [new TextRun({ text: line.trim().replace(/:$/, ''), bold: true, size: 22, font: FONT })],
      }))
      return
    }
    const b = bullet(line)
    if (b !== undefined) {
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: b, size: 20, font: FONT })] }))
      return
    }
    children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: line.trim(), size: 20, font: FONT })] }))
  })

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }] })
  return Packer.toBuffer(doc)
}

export function letterDocx(text: string): Promise<Buffer> {
  const paragraphs = text.replace(/\r/g, '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: paragraphs.map(p => new Paragraph({
        spacing: { after: 200, line: 300 },
        children: p.split('\n').flatMap((l, i) => (i ? [new TextRun({ text: l, break: 1, size: 22, font: FONT })] : [new TextRun({ text: l, size: 22, font: FONT })])),
      })),
    }],
  })
  return Packer.toBuffer(doc)
}

export const fileSafe = (s: string) => s.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'file'
