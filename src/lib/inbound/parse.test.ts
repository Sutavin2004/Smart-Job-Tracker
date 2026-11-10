import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { parseInbound, verifySvix, htmlToPlain } from './parse'

describe('parseInbound', () => {
  it('reads a LinkedIn Easy Apply confirmation', () => {
    const r = parseInbound({
      from: 'LinkedIn <jobs-noreply@linkedin.com>',
      subject: 'Jordan, your application was sent to Shopify',
      text: `Your application was sent to Shopify\n\nFrontend Engineer\nShopify · Toronto, ON (Hybrid)\nApplied on November 10, 2026\nView job: https://www.linkedin.com/comm/jobs/view/4012345678/?trackingId=abc\n`,
    })
    expect(r).toEqual({ kind: 'application', source: 'LinkedIn', company: 'Shopify', role: 'Frontend Engineer', location: 'Toronto, ON (Hybrid)', jobUrl: 'https://www.linkedin.com/comm/jobs/view/4012345678/' })
  })

  it('reads an Indeed Apply confirmation', () => {
    const r = parseInbound({
      from: 'Indeed Apply <indeedapply@indeed.com>',
      subject: 'Indeed Application: Junior Software Developer',
      text: `Application submitted\nJunior Software Developer\nNorthwind Labs - Toronto, ON\nThe following items were sent to Northwind Labs. Good luck!\nhttps://ca.indeed.com/viewjob?jk=abc123def&from=email`,
    })
    expect(r).toMatchObject({ kind: 'application', source: 'Indeed', company: 'Northwind Labs', role: 'Junior Software Developer', location: 'Toronto, ON', jobUrl: 'https://ca.indeed.com/viewjob?jk=abc123def' })
  })

  it('reads a company career-site confirmation', () => {
    const r = parseInbound({ from: 'no-reply@greenhouse.io', subject: 'Thank you for applying to Copperline', text: 'Thank you for applying for the Software Engineer II position at Copperline. We will review your application.' })
    expect(r).toMatchObject({ kind: 'application', company: 'Copperline', role: 'Software Engineer II' })
  })

  it('handles emails the user forwarded by hand', () => {
    const r = parseInbound({
      from: 'me@gmail.com',
      subject: 'Fwd: Alex, your application was sent to Ada',
      text: '---------- Forwarded message ---------\nFrom: LinkedIn <jobs-noreply@linkedin.com>\nDate: Mon\n\nYour application was sent to Ada\nJunior Software Engineer\nAda · Toronto, ON\n',
    })
    expect(r).toMatchObject({ kind: 'application', source: 'LinkedIn', company: 'Ada', role: 'Junior Software Engineer' })
  })

  it('pulls the code and link from Gmail forwarding confirmation', () => {
    const r = parseInbound({
      from: 'Gmail Team <forwarding-noreply@google.com>',
      subject: '(#123456789) Gmail Forwarding Confirmation - Receive Mail from me@gmail.com',
      text: 'To allow me@gmail.com to automatically forward mail to your address, please click the link below to confirm the request:\n\nhttps://mail-settings.google.com/mail/vf-%5Babc%5D-xyz\n\nConfirmation code: 123456789',
    })
    expect(r).toEqual({ kind: 'gmail-confirmation', code: '123456789', link: 'https://mail-settings.google.com/mail/vf-%5Babc%5D-xyz' })
  })

  it('ignores other email', () => {
    expect(parseInbound({ from: 'news@example.com', subject: 'Weekly newsletter', text: 'Hello' })).toEqual({ kind: 'unknown' })
  })

  it('falls back to HTML when there is no text part', () => {
    expect(htmlToPlain('<p>Hi&nbsp;there</p><div>Ada &middot; Toronto</div>')).toBe('Hi there\nAda · Toronto')
  })
})

describe('verifySvix', () => {
  const secret = 'whsec_' + Buffer.from('test-secret-key-0123456789').toString('base64')
  const body = '{"type":"email.received"}'
  const now = 1_800_000_000_000
  const sign = (id: string, ts: string, b: string) =>
    createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`${id}.${ts}.${b}`).digest('base64')

  it('accepts a correct signature', async () => {
    const ts = String(now / 1000)
    expect(await verifySvix(secret, { id: 'msg_1', timestamp: ts, signature: `v1,${sign('msg_1', ts, body)}` }, body, now)).toBe(true)
  })
  it('rejects tampering, old timestamps and missing headers', async () => {
    const ts = String(now / 1000)
    expect(await verifySvix(secret, { id: 'msg_1', timestamp: ts, signature: `v1,${sign('msg_1', ts, body)}` }, body + ' ', now)).toBe(false)
    const old = String(now / 1000 - 3600)
    expect(await verifySvix(secret, { id: 'msg_1', timestamp: old, signature: `v1,${sign('msg_1', old, body)}` }, body, now)).toBe(false)
    expect(await verifySvix(secret, { id: null, timestamp: ts, signature: 'v1,x' }, body, now)).toBe(false)
  })
})
