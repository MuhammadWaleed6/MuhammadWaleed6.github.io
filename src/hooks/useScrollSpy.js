import { useEffect, useState } from 'react'

/**
 * Scroll-spy: watches section IDs and returns the id of the section
 * currently crossing the middle of the viewport. Used by the navbar
 * to highlight the link matching the section in view.
 *
 * Sections may render async (content loads from Supabase), so we
 * poll briefly until every id exists in the DOM, then observe.
 */
export function useScrollSpy(ids = [], rootMargin = '-45% 0px -50% 0px') {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const targets = ids.filter(Boolean)
    if (targets.length === 0) return undefined

    let observer
    let cancelled = false
    let attempts = 0

    function attach() {
      if (cancelled) return
      const nodes = targets
        .map((id) => document.getElementById(id))
        .filter(Boolean)

      // All found -> observe and stop retrying.
      if (nodes.length === targets.length || attempts > 20) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) setActiveId(entry.target.id)
            })
          },
          { rootMargin }
        )
        nodes.forEach((n) => observer.observe(n))
        return
      }

      attempts += 1
      setTimeout(attach, 250)
    }

    attach()
    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [ids.join('|'), rootMargin])

  return activeId
}
