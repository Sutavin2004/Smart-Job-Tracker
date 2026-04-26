'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/lib/store'

export function KeyboardShortcuts() {
  const router = useRouter()
  const { setCommandPaletteOpen, setAddJobModalOpen } = useUIStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target as HTMLElement).isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setAddJobModalOpen(true)
        return
      }

      if (inInput) return

      switch (e.key) {
        case 'd': router.push('/'); break
        case 'j': router.push('/jobs'); break
        case 'g': router.push('/agent'); break
        case 'a': router.push('/analytics'); break
        case 'r': router.push('/resume'); break
        case 's': router.push('/settings'); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router, setCommandPaletteOpen, setAddJobModalOpen])

  return null
}
