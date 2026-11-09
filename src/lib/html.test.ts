import { describe, it, expect } from 'vitest'
import { htmlToText, decodeEntities } from './html'

describe('html helpers', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('R&amp;D &#8212; caf&eacute; &#x2713; &bogus;')).toBe('R&D — caf&eacute; ✓ &bogus;')
  })
  it('keeps structure and drops scripts', () => {
    const text = htmlToText('<h2>About</h2><p>Hello<br>world</p><script>alert(1)</script><ul><li>One</li><li>Two</li></ul>')
    expect(text).toBe('About\nHello\nworld\n\n• One\n• Two')
  })
})
