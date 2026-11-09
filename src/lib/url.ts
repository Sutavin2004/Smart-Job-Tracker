/** Compare URLs without protocol, www, trailing slash, hash or tracking params. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|refid$|trk|src$|from$)/i.test(k)) u.searchParams.delete(k)
    }
    u.hash = ''
    return (u.host.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '') + (u.search || '')).toLowerCase()
  } catch {
    return raw.trim().toLowerCase()
  }
}
