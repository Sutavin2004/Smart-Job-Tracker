import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api'
import { extractResumeText, MAX_RESUME_BYTES, UnsupportedFileError } from '@/lib/resume/extract'

export const runtime = 'nodejs'

/** Read an uploaded résumé file and return its text. Saving is a separate step so the user can review it first. */
export const POST = withAuth(async (req: NextRequest) => {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 })
  if (file.size > MAX_RESUME_BYTES) return NextResponse.json({ error: 'That file is over 5 MB.' }, { status: 413 })
  try {
    const text = await extractResumeText(file.name, new Uint8Array(await file.arrayBuffer()))
    return NextResponse.json({ text, name: file.name })
  } catch (e) {
    if (e instanceof UnsupportedFileError) return NextResponse.json({ error: e.message }, { status: 422 })
    console.error('resume upload', e)
    return NextResponse.json({ error: 'That file could not be read. Try saving it as a PDF or .docx again.' }, { status: 422 })
  }
})
