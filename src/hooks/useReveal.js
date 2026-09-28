import { useEffect, useState } from 'react'

/**
 * Scroll-reveal helper. Returns [ref, visible].
 * Uses a callback ref so it also works for elements that mount later
 * (e.g. content that renders after a Supabase fetch resolves) —
 * with a plain useRef the observer attached too early and the
 * element never became visible.
 * Respects prefers-reduced-motion (marks visible immediately).
 *
 * threshold defaults to 0: with stacked mobile/tablet layouts a whole
 * section grid can be taller than the viewport, so its intersection
 * ratio can never reach a positive threshold and it would stay hidden
 * (opacity: 0) forever. 0 = reveal as soon as any part enters the view.
 */
export function useReveal(options = {}) {
  const [node, setNode] = useState(null)
  const [visible, setVisible] = useState(false)
  const { threshold = 0, once = true } = options

  useEffect(() => {
    if (!node) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, threshold, once])

  return [setNode, visible]
}
