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
}

export default nextConfig
