import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Fetch a user-supplied public URL without letting it reach private networks
 * (SSRF protection): http(s) only, every hop's host must resolve to a public IP,
 * redirects are followed manually, and size and time are capped.
 */
export class UnsafeUrlError extends Error {}

export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateIp(mapped[1]) : false
  }
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) ||           // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224                              // multicast / reserved
  )
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new UnsafeUrlError('Only http(s) links are supported')
  if (url.username || url.password) throw new UnsafeUrlError('Links with credentials are not allowed')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new UnsafeUrlError('Private addresses are not allowed')
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (!addrs.length) throw new UnsafeUrlError("Couldn't find that website")
  if (addrs.some(a => isPrivateIp(a.address))) throw new UnsafeUrlError('Private addresses are not allowed')
}

export async function fetchPublicHtml(rawUrl: string, { maxBytes = 3_000_000, timeoutMs = 12_000 } = {}) {
  let url = new URL(rawUrl)
  const deadline = AbortSignal.timeout(timeoutMs)
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url)
    const res = await fetch(url, {
      redirect: 'manual',
      signal: deadline,
      headers: {
        // A normal browser UA: many job sites serve a stripped page to unknown clients.
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-CA,en;q=0.9',
      },
    })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url)
      continue
    }
    if (!res.ok) throw new Error(`The site responded with ${res.status}`)
    const type = res.headers.get('content-type') ?? ''
    if (type && !type.includes('html') && !type.includes('xml')) throw new Error('That link is not a web page')
    // Read with a size cap.
    const reader = res.body?.getReader()
    if (!reader) return { html: await res.text(), finalUrl: url.toString() }
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); break }
      chunks.push(value)
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks))
    return { html, finalUrl: url.toString() }
  }
  throw new Error('Too many redirects')
}
