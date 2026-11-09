import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobTrack — AI Job Search',
    short_name: 'JobTrack',
    description: 'Track applications and let an AI agent find matching jobs for you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F7F5',
    theme_color: '#1D6B57',
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
