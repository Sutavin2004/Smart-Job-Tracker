import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const API = join(process.cwd(), 'src/app/api')
// Routes allowed to use the unscoped client: they deal with accounts or run across users.
const ALLOWED = [/^auth\//, /^cron\//, /^health\//]

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? routes(p) : name === 'route.ts' ? [p] : []
  })
}

describe('API routes', () => {
  const files = routes(API)

  it('finds the route files', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(files.map(f => relative(API, f)))('%s only reads data through the per-user client', rel => {
    if (ALLOWED.some(re => re.test(rel))) return
    const src = readFileSync(join(API, rel), 'utf8')
    expect(src, 'imports the unscoped prisma client').not.toMatch(/from ['"]@\/lib\/prisma['"]/)
    // Every exported handler must be wrapped so it gets a signed-in user.
    const handlers = [...src.matchAll(/export (?:async function|const) (GET|POST|PUT|PATCH|DELETE)\b(.*)/g)]
    expect(handlers.length).toBeGreaterThan(0)
    for (const [, method, rest] of handlers) {
      expect(rest, `${method} is not wrapped in withAuth`).toMatch(/=\s*withAuth\(/)
    }
  })
})
