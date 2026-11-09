import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, SESSION_COOKIE, type SessionUser } from './auth'
import { scopedDb, NotFoundError, type ScopedDb } from './scoped-db'
import { QuotaError } from './quota'

export interface Auth {
  user: SessionUser
  db: ScopedDb
}

/**
 * Wrap an API route handler: requires a signed-in user and hands it a
 * database client scoped to that user. Maps common errors to HTTP codes.
 */
export function withAuth<C>(handler: (req: NextRequest, ctx: C, auth: Auth) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    const user = await getUserByToken(req.cookies.get(SESSION_COOKIE)?.value)
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    try {
      return await handler(req, ctx, { user, db: scopedDb(user.id) })
    } catch (err) {
      if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 })
      if (err instanceof QuotaError) return NextResponse.json({ error: err.message }, { status: 429 })
      if (err instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      console.error(`[${req.method} ${req.nextUrl.pathname}]`, err)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }
}
