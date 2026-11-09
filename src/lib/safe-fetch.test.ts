import { describe, it, expect } from 'vitest'
import { isPrivateIp, fetchPublicHtml, UnsafeUrlError } from './safe-fetch'

describe('SSRF guard', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', '::ffff:10.0.0.1'])(
    'blocks private address %s', ip => expect(isPrivateIp(ip)).toBe(true))
  it.each(['8.8.8.8', '151.101.1.69', '2606:4700::1111'])('allows public address %s', ip => expect(isPrivateIp(ip)).toBe(false))

  it('rejects non-http schemes, credentials and internal hosts before fetching', async () => {
    await expect(fetchPublicHtml('file:///etc/passwd')).rejects.toBeInstanceOf(UnsafeUrlError)
    await expect(fetchPublicHtml('http://user:pw@example.com')).rejects.toBeInstanceOf(UnsafeUrlError)
    await expect(fetchPublicHtml('http://localhost:3000')).rejects.toBeInstanceOf(UnsafeUrlError)
    await expect(fetchPublicHtml('http://169.254.169.254/latest/meta-data')).rejects.toBeInstanceOf(UnsafeUrlError)
  })
})
