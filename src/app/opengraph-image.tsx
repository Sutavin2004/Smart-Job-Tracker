import { ImageResponse } from 'next/og'

export const alt = 'JobTrack: track every application and find jobs that fit'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const ROWS: [string, string, string][] = [
  ['Fieldnote', 'Frontend Engineer', 'Interview'],
  ['Copperline', 'Software Engineer II', 'Applied'],
  ['Harbor & Pine', 'Full Stack Developer', 'Offer'],
]

/** Link preview image for Slack, LinkedIn, iMessage, etc. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#175847', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>JobTrack</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1, maxWidth: 980 }}>
            Every application in one place, and new jobs worth your time each morning.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44, fontSize: 26 }}>
            {ROWS.map(([c, r, s]) => (
              <div key={c} style={{ display: 'flex', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.18)' }}>
                <div style={{ width: 300, fontWeight: 600 }}>{c}</div>
                <div style={{ width: 460, color: 'rgba(255,255,255,0.75)' }}>{r}</div>
                <div style={{ color: s === 'Offer' ? '#ffffff' : 'rgba(255,255,255,0.75)' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
