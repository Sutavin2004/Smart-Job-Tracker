import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path MUST match the GitHub repo name for GitHub Pages routing to work
export default defineConfig({
  plugins: [react()],
  base: '/Smart-Job-Tracker/',
})
