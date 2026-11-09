/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(raw: string | string[] | undefined | null) {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/'
}
