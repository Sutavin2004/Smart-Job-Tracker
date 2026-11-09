import { ImageResponse } from 'next/og'

export const alt = 'JobTrack — AI job search assistant'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Link preview image for Slack, LinkedIn, iMessage, etc. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg,#1a1236 0%,#0f0e1a 60%)', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 26, background: 'linear-gradient(135deg,#8448ff,#4f8fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>✦</div>
          <div style={{ fontSize: 64, fontWeight: 800 }}>JobTrack</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 44, fontWeight: 700, lineHeight: 1.2, maxWidth: 950 }}>
          An AI agent that finds jobs that fit you, and a board to track every application.
        </div>
        <div style={{ marginTop: 32, display: 'flex', gap: 16, fontSize: 26, color: '#b9b4ff' }}>
          <span>Daily job discovery</span><span>·</span><span>Fit scoring</span><span>·</span><span>Cover letters & interview prep</span>
        </div>
      </div>
    ),
    size,
  )
}
