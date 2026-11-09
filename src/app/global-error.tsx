'use client'

/** Last-resort boundary if the root layout itself fails. Must render its own <html>. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
          <button onClick={reset} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 10, border: 0, background: '#6d5cff', color: '#fff', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
