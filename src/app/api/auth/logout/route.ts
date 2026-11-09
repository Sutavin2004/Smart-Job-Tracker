import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, clearedSessionCookie, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await deleteSession(req.cookies.get(SESSION_COOKIE)?.value)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearedSessionCookie)
  return res
}
