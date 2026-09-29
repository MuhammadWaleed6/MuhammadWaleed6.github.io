/**
 * Generates static per-route copies of dist/index.html so GitHub Pages
 * serves real 200 responses for deep links like /about instead of the
 * SPA-fallback 404 that Google cannot index.
 *
 * Each copy gets route-specific title/description/canonical/OG tags that
 * exactly match what the React page sets at runtime, so crawlers that
 * render JS and those that don't see consistent metadata.
 *
 * Runs automatically after `vite build` (see package.json).
 *
 * Additionally, if SUPABASE_URL + SUPABASE_ANON_KEY are present in the
 * environment (they are, during GitHub Actions builds), every published
 * blog post also gets a static page at dist/blog/<slug>/index.html with
 * its own title/description/canonical/og:image — so deep links to
 * articles answer Google with a real 200 + correct metadata.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DIST = 'dist'
const template = readFileSync(join(DIST, 'index.html'), 'utf8')

async function fetchPublishedPosts() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/blog_posts?select=title,slug,excerpt,cover_image_url&is_published=eq.true&order=sort_order.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

const ROUTES = [
  {
    path: '/',
    title: 'Muhammad Walid | Web Developer & Portfolio',
    description:
      'Portfolio of Muhammad Walid, a web developer building modern websites and web applications with React, Node.js and clean, user-focused design. Explore projects, services and get in touch.',
  },
  {
    path: '/about',
    title: 'About — Muhammad Walid',
    description:
      'Learn about Muhammad Walid — a web developer with a business & IT background, four years of hands-on web experience, and a practical, business-aware approach to building products.',
  },
  {
    path: '/skills',
    title: 'Skills — Muhammad Walid',
    description:
      'The technologies and tools Muhammad Walid works with — including HTML, CSS, JavaScript, React and Node.js — for building modern websites and web applications.',
  },
  {
    path: '/projects',
    title: 'Projects — Muhammad Walid',
    description:
      'Browse real projects built by Muhammad Walid — websites and web applications taken end-to-end, from the first idea to a deployed product.',
  },
  {
    path: '/services',
    title: 'Services — Muhammad Walid',
    description:
      'Web development services by Muhammad Walid — from a first website to modern web applications, with focused, practical delivery.',
  },
  {
    path: '/team',
    title: 'Team — Muhammad Walid',
    description:
      'Meet the trusted collaborators Muhammad Walid works with to design, build and ship bigger web projects.',
  },
  {
    path: '/contact',
    title: 'Contact — Muhammad Walid',
    description:
      'Get in touch with Muhammad Walid — send a message about your project, question or idea, and expect a reply within a day or two.',
  },
  {
    path: '/blog',
    title: 'Blog — Muhammad Walid',
    description:
      'Articles by Muhammad Walid on web development — React, responsive design, Supabase and lessons learned building real websites and client projects.',
  },
]

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function replaceFirst(html, regex, replacement, label) {
  if (!regex.test(html)) {
    throw new Error(`generate-route-pages: could not find ${label} in index.html`)
  }
  return html.replace(regex, replacement)
}

function buildPage({ path, title, description, image }) {
  const url = `https://mwalid.me${path}`
  let html = template

  html = replaceFirst(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, 'title')
  html = replaceFirst(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(description)}" />`,
    'meta description'
  )
  html = replaceFirst(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical'
  )
  html = replaceFirst(
    html,
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${esc(title)}" />`,
    'og:title'
  )
  html = replaceFirst(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${esc(description)}" />`,
    'og:description'
  )
  html = replaceFirst(
    html,
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${url}" />`,
    'og:url'
  )
  html = replaceFirst(
    html,
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    'twitter:title'
  )
  html = replaceFirst(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    'twitter:description'
  )
  if (image) {
    if (/<meta\s+property="og:image"/.test(html)) {
      html = html.replace(/<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${esc(image)}" />`)
    } else {
      html = html.replace(
        /<meta\s+name="twitter:card"[\s\S]*?\/>/,
        `<meta property="og:image" content="${esc(image)}" />\n    <meta name="twitter:card" content="summary_large_image" />`
      )
    }
  }
  return html
}

for (const route of ROUTES) {
  const html = buildPage(route)
  const outFile =
    route.path === '/'
      ? join(DIST, 'index.html')
      : join(DIST, route.path.slice(1), 'index.html')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
  console.log(`  ✓ ${route.path} → ${outFile}`)
}

// Static page per published blog post (needs Supabase env at build time)
const posts = await fetchPublishedPosts()
for (const post of posts) {
  const html = buildPage({
    path: `/blog/${post.slug}`,
    title: `${post.title} — Blog`,
    description: post.excerpt,
    image: post.cover_image_url || undefined,
  })
  const outFile = join(DIST, 'blog', post.slug, 'index.html')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
  console.log(`  ✓ /blog/${post.slug} → ${outFile}`)
}

console.log(
  `generate-route-pages: ${ROUTES.length} route pages + ${posts.length} blog post pages written.`
)
