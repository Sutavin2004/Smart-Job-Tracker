/** Input checks shared by the auth routes (no server-only imports, so they're unit-testable). */
export const normalizeEmail = (e: unknown) => (typeof e === 'string' ? e.trim().toLowerCase() : '')
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254

export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < 8) return 'Use at least 8 characters.'
  if (pw.length > 200) return 'That password is too long.'
  return null
}
