import type { NextConfig } from 'next'

// When NEXT_PUBLIC_BASE_PATH is set (GitHub Pages build), produce a static export.
// In local dev and Railway, output is omitted so API routes work normally.
const isStaticExport = Boolean(process.env.NEXT_PUBLIC_BASE_PATH)

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    }]
  },
}

export default nextConfig
