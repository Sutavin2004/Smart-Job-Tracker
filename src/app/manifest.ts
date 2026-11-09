import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobTrack — AI Job Search',
    short_name: 'JobTrack',
    description: 'Track applications and let an AI agent find matching jobs for you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0e1a',
    theme_color: '#6d5cff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Jobs board', url: '/jobs' },
      { name: 'Job Agent', url: '/agent' },
    ],
  }
}
