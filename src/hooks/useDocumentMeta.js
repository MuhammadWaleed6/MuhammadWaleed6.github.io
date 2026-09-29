import { useEffect } from 'react'

export const SITE_URL = 'https://mwalid.me'

function upsertMeta(attr, key, content) {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

/**
 * Per-page SEO metadata.
 *  - title/description: unique per public page (falls back to the index.html
 *    defaults when omitted).
 *  - canonicalPath: path on the canonical domain, e.g. "/projects".
 *  - noindex: true for private pages (admin dashboard) — adds a robots
 *    noindex directive that survives client-side navigation.
 *  - image: absolute URL used as og:image / twitter card image on pages
 *    that have one (project covers, team photos).
 */
export function useDocumentMeta({ title, description, canonicalPath, noindex = false, image } = {}) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    if (title) {
      upsertMeta('property', 'og:title', title)
      upsertMeta('name', 'twitter:title', title)
    }

    if (noindex) {
      upsertMeta('name', 'robots', 'noindex, nofollow')
    } else {
      // Restore the default directive when navigating back to a public page.
      upsertMeta('name', 'robots', 'index, follow, max-image-preview:large')
    }

    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:card', 'summary_large_image')
    } else {
      upsertMeta('name', 'twitter:card', 'summary')
    }

    if (canonicalPath !== undefined) {
      const url = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`
      upsertCanonical(url)
      upsertMeta('property', 'og:url', url)
    }
  }, [title, description, canonicalPath, noindex, image])
}
