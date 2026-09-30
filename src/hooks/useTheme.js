import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'
const VALID = ['light', 'dark']

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0d0d' : '#111111')
}

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (VALID.includes(stored)) return stored
  } catch {
    /* storage unavailable */
  }
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  // Keep every hook instance in sync when the theme changes elsewhere.
  useEffect(() => {
    const onChange = (e) => setTheme(e.detail)
    window.addEventListener('theme-change', onChange)
    return () => window.removeEventListener('theme-change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* storage unavailable */
      }
      window.dispatchEvent(new CustomEvent('theme-change', { detail: next }))
      return next
    })
  }, [])

  // Make sure the DOM attribute matches the resolved state on mount.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return { theme, toggle }
}
